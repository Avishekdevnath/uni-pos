import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from './entities/audit-log.entity';
import { OrderCompletedEvent, OrderCancelledEvent } from '../common/events/order.events';
import { PaymentRecordedEvent } from '../common/events/payment.events';
import { InventoryDeductedEvent, LowStockEvent, StockInEvent } from '../common/events/inventory.events';

@Injectable()
export class AuditLogHandler {
  private readonly logger = new Logger(AuditLogHandler.name);

  constructor(
    @InjectRepository(AuditLogEntity) private readonly auditRepo: Repository<AuditLogEntity>,
  ) {}

  @OnEvent('order.completed')
  async handleOrderCompleted(event: OrderCompletedEvent) {
    await this.writeLog('order.completed', 'order', event.orderId, event);
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent) {
    await this.writeLog('order.cancelled', 'order', event.orderId, event);
  }

  @OnEvent('payment.recorded')
  async handlePaymentRecorded(event: PaymentRecordedEvent) {
    await this.writeLog('payment.recorded', 'payment', event.paymentId, event);
  }

  @OnEvent('inventory.deducted')
  async handleInventoryDeducted(event: InventoryDeductedEvent) {
    await this.writeLog('inventory.deducted', 'order', event.orderId, event);
  }

  @OnEvent('inventory.low_stock')
  async handleLowStock(event: LowStockEvent) {
    await this.writeLog('inventory.low_stock', 'product', event.productId, event);
  }

  @OnEvent('inventory.stock_in')
  async handleStockIn(event: StockInEvent) {
    await this.writeLog('inventory.stock_in', 'inventory_batch', event.batchId, event);
  }

  private async writeLog(eventType: string, entityType: string, entityId: string, event: any) {
    try {
      const log = this.auditRepo.create({
        tenantId: event.tenantId,
        branchId: event.branchId ?? null,
        actorId: event.actorId ?? null,
        eventType, entityType, entityId,
        payload: event,
        occurredAt: event.occurredAt ?? new Date(),
      });
      await this.auditRepo.save(log);
    } catch (err) {
      this.logger.error(`Failed to write audit log for ${eventType}`, err);
    }
  }
}
