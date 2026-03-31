import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { InventoryService } from '../inventory/inventory.service';
import { TaxService } from '../tax/tax.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { PricingService } from '../pricing/pricing.service';
import { BranchEntity } from '../database/entities/branch.entity';
import { OrderEntity } from '../orders/entities/order.entity';

export interface CheckoutCompleteResult {
  order: OrderEntity;
  receiptToken: string;
  receiptUrl: string;
}

import { CompleteOrderDto } from '../orders/dto/complete-order.dto';
import { CancelOrderDto } from '../orders/dto/cancel-order.dto';

import { OrderCompletedEvent, OrderCancelledEvent } from '../common/events/order.events';
import { LowStockEvent } from '../common/events/inventory.events';
import { PaymentRecordedEvent } from '../common/events/payment.events';
import { InventoryDeductedEvent, StockInEvent } from '../common/events/inventory.events';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly inventoryService: InventoryService,
    private readonly taxService: TaxService,
    private readonly receiptsService: ReceiptsService,
    private readonly pricingService: PricingService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async complete(
    orderId: string,
    tenantId: string,
    actorId: string,
    dto: CompleteOrderDto,
  ): Promise<CheckoutCompleteResult> {
    // Step 1: Load order with all relations (items.product included via getOrder)
    const order = await this.ordersService.getOrder(tenantId, orderId);

    // Step 2: Validate completable (pre-transaction guard)
    this.ordersService.validateCompletable(order);

    const eventBuffer: Array<
      | OrderCompletedEvent
      | OrderCancelledEvent
      | LowStockEvent
      | PaymentRecordedEvent
      | InventoryDeductedEvent
      | StockInEvent
    > = [];

    // Resolve branch-level price overrides before entering transaction
    // Skip non-catalog items (null product_id) — they carry their own unitPrice
    for (const item of order.items) {
      if (item.productId !== null) {
        item.unitPrice = await this.pricingService.resolvePrice(order.branchId, item.productId);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      // Step 3: Calculate totals authoritatively (writes item rows + order amounts)
      await this.ordersService.calculateTotals(manager, order, this.taxService);

      // Step 4: Validate and record payments (validates sum == totalAmount)
      await this.paymentsService.recordPayments(manager, order, dto.payments);

      // Step 5: Deduct inventory; skip non-catalog items (null product_id)
      const deductItems = order.items
        .filter((item) => item.productId !== null)
        .map((item) => ({
          productId: item.productId!,
          quantity: item.quantity,
          orderId: order.id,
        }));
      const lowStockPayloads = await this.inventoryService.deductStock(
        manager,
        tenantId,
        order.branchId,
        deductItems,
      );

      // Step 6: Generate deterministic order number (sequence table, advisory lock via ON CONFLICT)
      const branch = await manager.findOne(BranchEntity, {
        where: { id: order.branchId },
      });
      if (!branch) {
        throw new Error(`Branch ${order.branchId} not found`);
      }
      const orderNumber = await this.ordersService.generateOrderNumber(
        manager,
        order.branchId,
        branch.code,
      );

      // Step 7: Transition order → completed
      await this.ordersService.transition(manager, order, 'completed', {
        completedAt: new Date(),
        orderNumber,
      });

      // Buffer events — not emitted until after transaction commits
      eventBuffer.push(
        new OrderCompletedEvent({
          tenantId,
          branchId: order.branchId,
          occurredAt: new Date(),
          actorId,
          orderId: order.id,
          orderNumber,
          totalAmount: order.totalAmount,
          paidAmount: order.paidAmount,
          itemCount: order.items.length,
        }),
      );

      for (const p of lowStockPayloads) {
        eventBuffer.push(
          new LowStockEvent({
            tenantId,
            branchId: order.branchId,
            occurredAt: new Date(),
            actorId,
            productId: p.productId,
            productName: '', // product name lookup deferred — consumers may enrich
            currentStock: p.currentStock,
            threshold: p.threshold,
          }),
        );
      }
    });

    // Emit post-commit — domain events are fire-and-forget; no rollback risk
    for (const event of eventBuffer) {
      this.eventEmitter.emit(getEventName(event), event);
    }

    const completedOrder = await this.ordersService.getOrder(tenantId, orderId);

    // Generate receipt token post-commit (idempotent: if token already exists, load it)
    let receiptToken: string;
    try {
      receiptToken = await this.receiptsService.createToken(orderId, tenantId);
    } catch {
      // Token may already exist (orderId is unique) — fetch existing one
      receiptToken = (await this.receiptsService.getTokenByOrderId(orderId)) ?? '';
    }

    const backendUrl = process.env.BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const receiptUrl = `${backendUrl}/receipts/html/${receiptToken}`;

    return { order: completedOrder, receiptToken, receiptUrl };
  }

  async cancel(
    orderId: string,
    tenantId: string,
    actorId: string,
    dto: CancelOrderDto,
  ): Promise<OrderEntity> {
    // Load order with relations (needed for validateCancellable status check)
    const order = await this.ordersService.getOrder(tenantId, orderId);

    // Pre-transaction guard
    this.ordersService.validateCancellable(order);

    const eventBuffer: Array<OrderCancelledEvent> = [];

    await this.dataSource.transaction(async (manager) => {
      await this.ordersService.transition(manager, order, 'cancelled', {
        cancelledAt: new Date(),
        cancelledBy: actorId,
        cancellationReason: dto.reason ?? undefined,
      });

      eventBuffer.push(
        new OrderCancelledEvent({
          tenantId,
          branchId: order.branchId,
          occurredAt: new Date(),
          actorId,
          orderId: order.id,
          orderNumber: order.orderNumber ?? null,
          cancellationReason: dto.reason ?? null,
        }),
      );
    });

    for (const event of eventBuffer) {
      this.eventEmitter.emit(getEventName(event), event);
    }

    return this.ordersService.getOrder(tenantId, orderId);
  }
}

function getEventName(event: unknown): string {
  if (event instanceof OrderCompletedEvent) return 'order.completed';
  if (event instanceof OrderCancelledEvent) return 'order.cancelled';
  if (event instanceof PaymentRecordedEvent) return 'payment.recorded';
  if (event instanceof InventoryDeductedEvent) return 'inventory.deducted';
  if (event instanceof LowStockEvent) return 'inventory.low_stock';
  if (event instanceof StockInEvent) return 'inventory.stock_in';
  return 'unknown';
}
