import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderItemTaxEntity } from './entities/order-item-tax.entity';
import { OrderDiscountEntity } from './entities/order-discount.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { TenantEntity } from '../database/entities/tenant.entity';
import { TaxService } from '../tax/tax.service';
import { DiscountsService } from '../discounts/discounts.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { ApplyOrderDiscountDto } from './dto/apply-order-discount.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly itemRepo: Repository<OrderItemEntity>,
    @InjectRepository(OrderItemTaxEntity)
    private readonly itemTaxRepo: Repository<OrderItemTaxEntity>,
    @InjectRepository(OrderDiscountEntity)
    private readonly discountRepo: Repository<OrderDiscountEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    private readonly discountsService: DiscountsService,
    private readonly taxService: TaxService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Step 1: createDraft ────────────────────────────────────────────────────

  async createDraft(
    tenantId: string,
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderEntity> {
    if (dto.client_event_id) {
      const existing = await this.orderRepo.findOne({
        where: { clientEventId: dto.client_event_id, tenantId },
      });
      if (existing) return existing;
    }

    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    const currency = tenant?.defaultCurrency ?? 'USD';

    const order = this.orderRepo.create({
      tenantId,
      branchId: dto.branch_id,
      customerId: dto.customer_id ?? null,
      notes: dto.notes ?? null,
      clientEventId: dto.client_event_id ?? null,
      status: 'draft',
      currency,
      subtotalAmount: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
    });

    return this.orderRepo.save(order);
  }

  // ─── Step 2: addItem ────────────────────────────────────────────────────────

  async addItem(
    tenantId: string,
    orderId: string,
    dto: AddOrderItemDto,
  ): Promise<OrderItemEntity> {
    const order = await this.findDraftOrThrow(tenantId, orderId);

    let product = null;
    if (dto.product_id) {
      product = await this.productRepo.findOne({
        where: { id: dto.product_id, tenantId },
      });
      if (!product) throw new NotFoundException('Product not found');
    } else if (!dto.description) {
      throw new BadRequestException('Either product_id or description is required');
    }

    const item = this.itemRepo.create({
      orderId,
      productId: dto.product_id ?? null,
      description: dto.description ?? null,
      manualTaxRate: dto.manual_tax_rate ?? 0,
      quantity: dto.quantity,
      unitPrice: product ? product.price : (dto.unit_price ?? 0),
      productNameSnapshot: product?.name ?? dto.description ?? null,
      skuSnapshot: product?.sku ?? null,
      lineSubtotal: 0,
      lineDiscountAmount: 0,
      orderDiscountShare: 0,
      discountedAmount: 0,
      baseAmount: 0,
      taxAmount: 0,
      lineTotal: 0,
    });

    return this.itemRepo.save(item);
  }

  // ─── Step 3: updateItem / removeItem ────────────────────────────────────────

  async updateItem(
    tenantId: string,
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemDto,
  ): Promise<OrderItemEntity> {
    await this.findDraftOrThrow(tenantId, orderId);

    const item = await this.itemRepo.findOne({ where: { id: itemId, orderId } });
    if (!item) throw new NotFoundException('Order item not found');

    item.quantity = dto.quantity;
    return this.itemRepo.save(item);
  }

  async removeItem(
    tenantId: string,
    orderId: string,
    itemId: string,
  ): Promise<void> {
    await this.findDraftOrThrow(tenantId, orderId);

    const item = await this.itemRepo.findOne({ where: { id: itemId, orderId } });
    if (!item) throw new NotFoundException('Order item not found');

    await this.itemRepo.remove(item);
  }

  // ─── Step 4: applyDiscount ──────────────────────────────────────────────────

  async applyDiscount(
    tenantId: string,
    orderId: string,
    dto: ApplyOrderDiscountDto,
  ): Promise<OrderDiscountEntity> {
    const order = await this.findDraftOrThrow(tenantId, orderId);

    const existingDiscounts = await this.discountRepo.find({ where: { orderId } });

    // Map OrderDiscountEntity to OrderDiscountLike for the combinability check
    const discountLikes = existingDiscounts.map((d) => ({
      scope: d.scopeSnapshot,
      isCombinable: true, // snapshots don't track this; presets are validated live
      presetId: d.discountPresetId,
    }));

    const preset = await this.discountsService.validatePresetApplicable(
      tenantId,
      order.branchId,
      dto.discount_preset_id,
      discountLikes,
    );

    const discount = this.discountRepo.create({
      orderId,
      discountPresetId: dto.discount_preset_id,
      computedAmount: 0,
      presetNameSnapshot: preset.name,
      typeSnapshot: preset.type,
      valueSnapshot: preset.value,
      scopeSnapshot: preset.scope,
      orderItemIdSnapshot: dto.order_item_id ?? null,
    });

    return this.discountRepo.save(discount);
  }

  // ─── Step 5: removeDiscount ─────────────────────────────────────────────────

  async removeDiscount(
    tenantId: string,
    orderId: string,
    discountId: string,
  ): Promise<void> {
    await this.findDraftOrThrow(tenantId, orderId);

    const discount = await this.discountRepo.findOne({
      where: { id: discountId, orderId },
    });
    if (!discount) throw new NotFoundException('Order discount not found');

    await this.discountRepo.remove(discount);
  }

  // ─── Step 6: getOrderPreview ────────────────────────────────────────────────

  async getOrderPreview(
    tenantId: string,
    orderId: string,
  ): Promise<{ order: OrderEntity; items: OrderItemEntity[]; discounts: OrderDiscountEntity[] }> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const [items, discounts] = await Promise.all([
      this.itemRepo.find({ where: { orderId } }),
      this.discountRepo.find({ where: { orderId } }),
    ]);

    return { order, items, discounts };
  }

  // ─── Step 7: calculateTotals ────────────────────────────────────────────────

  async calculateTotals(
    manager: EntityManager,
    order: OrderEntity,
    taxService: TaxService,
  ): Promise<void> {
    const items: OrderItemEntity[] = order.items ?? [];
    const discounts: OrderDiscountEntity[] = order.discounts ?? [];

    // Step 1: DELETE existing order_item_taxes (idempotent)
    if (items.length > 0) {
      await manager.delete(OrderItemTaxEntity, {
        orderItemId: In(items.map((i) => i.id)),
      });
    }

    // Step 2: Recalculate order_discounts.computed_amount
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    for (const discount of discounts) {
      if (discount.typeSnapshot === 'percentage') {
        let amt = subtotal * (discount.valueSnapshot / 100);
        if (discount.preset?.maxDiscountAmount) {
          amt = Math.min(amt, discount.preset.maxDiscountAmount);
        }
        discount.computedAmount =
          subtotal < (discount.preset?.minOrderAmount ?? 0) ? 0 : amt;
      } else {
        // flat
        discount.computedAmount = Math.min(discount.valueSnapshot, subtotal);
      }
      await manager.save(OrderDiscountEntity, discount);
    }

    // Steps 3–17: Per-item calculation
    let orderSubtotal = 0;
    let orderDiscountTotal = 0;
    let orderTaxTotal = 0;
    let orderTotal = 0;

    const totalOrderDiscount = discounts
      .filter((d) => d.scopeSnapshot === 'order')
      .reduce((sum, d) => sum + d.computedAmount, 0);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Step 3: line_subtotal
      item.lineSubtotal = item.quantity * item.unitPrice;

      // Step 4: line_discount_amount (line-level discounts only)
      const lineDiscount = discounts.find(
        (d) =>
          d.scopeSnapshot === 'line_item' && d.orderItemIdSnapshot === item.id,
      );
      item.lineDiscountAmount = lineDiscount?.computedAmount ?? 0;

      // Step 5: pro-rata order discount distribution
      const proRataShare =
        subtotal > 0 ? (item.lineSubtotal / subtotal) * totalOrderDiscount : 0;

      // Last item gets remainder to avoid rounding gaps
      item.orderDiscountShare =
        i === items.length - 1
          ? totalOrderDiscount -
            items.slice(0, i).reduce((s, it) => s + it.orderDiscountShare, 0)
          : Math.round(proRataShare * 100) / 100;

      // Step 6: discounted_amount
      item.discountedAmount =
        item.lineSubtotal - item.lineDiscountAmount - item.orderDiscountShare;

      // Steps 7–9: tax resolution and back-calculation
      const taxes = await taxService.resolveProductTaxes(
        order.tenantId,
        order.branchId,
        item.product?.taxGroupId ?? null,
      );

      const sumInclusiveRates =
        taxes
          .filter((t) => t.isInclusive)
          .reduce((s, t) => s + t.rate, 0) / 100;

      // Step 9: base_amount (back-calculate to remove inclusive tax)
      item.baseAmount =
        sumInclusiveRates > 0
          ? item.discountedAmount / (1 + sumInclusiveRates)
          : item.discountedAmount;

      // Steps 10–12: per-tax calculation
      let itemTaxTotal = 0;
      for (const tax of taxes) {
        const taxAmt = Math.round(item.baseAmount * (tax.rate / 100) * 100) / 100;
        const itemTax = manager.create(OrderItemTaxEntity, {
          orderItemId: item.id,
          taxConfigId: tax.id,
          taxNameSnapshot: tax.name,
          taxRateSnapshot: tax.rate,
          isInclusive: tax.isInclusive,
          taxAmount: taxAmt,
        });
        await manager.save(itemTax);
        itemTaxTotal += taxAmt;
      }

      item.taxAmount = itemTaxTotal;

      // Step 11: line_total
      item.lineTotal = item.baseAmount + item.taxAmount;
      await manager.save(OrderItemEntity, item);

      orderSubtotal += item.lineSubtotal;
      orderDiscountTotal += item.lineDiscountAmount + item.orderDiscountShare;
      orderTaxTotal += item.taxAmount;
      orderTotal += item.lineTotal;
    }

    // Update order amounts
    order.subtotalAmount = orderSubtotal;
    order.discountAmount = orderDiscountTotal;
    order.taxAmount = orderTaxTotal;
    order.totalAmount = orderTotal;
    await manager.save(OrderEntity, order);
  }

  // ─── Step 8: validateCompletable ────────────────────────────────────────────

  validateCompletable(order: OrderEntity): void {
    if (order.status !== 'draft') {
      throw new BadRequestException('Order is not a draft');
    }
    const items: OrderItemEntity[] = order.items ?? [];
    if (!items || items.length === 0) {
      throw new BadRequestException('Order has no items');
    }
  }

  // ─── Step 9: validateCancellable ────────────────────────────────────────────

  validateCancellable(order: OrderEntity): void {
    if (!['draft', 'completed'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order with status ${order.status}`,
      );
    }
  }

  // ─── Step 10: transition ────────────────────────────────────────────────────

  async transition(
    manager: EntityManager,
    order: OrderEntity,
    toStatus: string,
    meta?: {
      completedAt?: Date;
      orderNumber?: string;
      cancelledAt?: Date;
      cancelledBy?: string;
      cancellationReason?: string;
    },
  ): Promise<OrderEntity> {
    const valid: Record<string, string[]> = {
      draft: ['completed', 'cancelled'],
      completed: ['cancelled'],
      cancelled: [],
    };

    if (!valid[order.status]?.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${toStatus}`,
      );
    }

    order.status = toStatus;
    if (meta?.completedAt) order.completedAt = meta.completedAt;
    if (meta?.orderNumber) order.orderNumber = meta.orderNumber;
    if (meta?.cancelledAt) order.cancelledAt = meta.cancelledAt;
    if (meta?.cancelledBy) order.cancelledBy = meta.cancelledBy;
    if (meta?.cancellationReason) order.cancellationReason = meta.cancellationReason;

    return manager.save(OrderEntity, order);
  }

  // ─── Step 11: generateOrderNumber ───────────────────────────────────────────

  async generateOrderNumber(
    manager: EntityManager,
    branchId: string,
    branchCode: string,
  ): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    const dateStr = today.replace(/-/g, '');

    const row = await manager.query(
      `INSERT INTO order_number_sequences (branch_id, sequence_date, last_sequence)
       VALUES ($1, $2, 1)
       ON CONFLICT (branch_id, sequence_date)
       DO UPDATE SET last_sequence = order_number_sequences.last_sequence + 1
       RETURNING last_sequence`,
      [branchId, today],
    );

    const seq = String(row[0].last_sequence).padStart(4, '0');
    return `${dateStr}-${branchCode}-${seq}`;
  }

  // ─── Step 12: listOrders / getOrder / cleanupDraft ──────────────────────────

  async listOrders(
    tenantId: string,
    query: ListOrdersQueryDto,
  ): Promise<{ data: OrderEntity[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.branchId = :branchId', { branchId: query.branch_id });

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('order.orderNumber ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.from) {
      qb.andWhere('order.createdAt >= :from', { from: new Date(query.from) });
    }

    if (query.to) {
      qb.andWhere('order.createdAt <= :to', { to: new Date(query.to) });
    }

    qb.orderBy('order.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async getOrder(tenantId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Attach related data as plain properties for serialisation
    const items = await this.itemRepo.find({
      where: { orderId: order.id },
      relations: ['product'],
    });
    const itemsWithTaxes = await Promise.all(
      items.map(async (item) => {
        item.taxes = await this.itemTaxRepo.find({
          where: { orderItemId: item.id },
        });
        return item;
      }),
    );
    const discounts = await this.discountRepo.find({ where: { orderId: order.id } });

    order.items = itemsWithTaxes;
    order.discounts = discounts;

    return order;
  }

  async cleanupDraft(tenantId: string, orderId: string): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'draft') {
      throw new BadRequestException('Can only clean up draft orders');
    }

    const items = await this.itemRepo.find({ where: { orderId } });

    if (items.length > 0) {
      await this.itemTaxRepo.delete({ orderItemId: In(items.map((i) => i.id)) });
    }

    await this.discountRepo.delete({ orderId });
    await this.itemRepo.delete({ orderId });
    await this.orderRepo.delete({ id: orderId });
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findDraftOrThrow(
    tenantId: string,
    orderId: string,
  ): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'draft') {
      throw new BadRequestException('Order is not in draft status');
    }
    return order;
  }
}
