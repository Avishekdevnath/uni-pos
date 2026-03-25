import { ConflictException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { OrderEntity } from '../orders/entities/order.entity';

describe('CheckoutService - idempotency replay guards', () => {
  let service: CheckoutService;

  const ordersService = {
    getOrder: jest.fn(),
    validateCompletable: jest.fn(),
    calculateTotals: jest.fn(),
    generateOrderNumber: jest.fn(),
    transition: jest.fn(),
  };

  const paymentsService = {
    recordPayments: jest.fn(),
  };

  const inventoryService = {
    deductStock: jest.fn(),
  };

  const taxService = {};

  const receiptsService = {
    createToken: jest.fn(),
    getTokenByOrderId: jest.fn(),
  };

  const pricingService = {
    resolvePrice: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
  };

  const eventEmitter = {
    emit: jest.fn(),
  };

  const makeCompletedOrder = (overrides: Partial<OrderEntity> = {}): OrderEntity => {
    return {
      id: 'ord_1',
      tenantId: 'ten_1',
      branchId: 'br_1',
      createdBy: 'user_1',
      customerId: null,
      orderNumber: '20260325-BR01-0001',
      status: 'completed',
      subtotalAmount: 100,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 100,
      paidAmount: 100,
      notes: null,
      clientEventId: 'evt-00000000-0000-4000-8000-000000000001',
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
      completedAt: new Date('2026-03-25T00:00:00.000Z'),
      createdAt: new Date('2026-03-25T00:00:00.000Z'),
      updatedAt: new Date('2026-03-25T00:00:00.000Z'),
      items: [],
      discounts: [],
      ...overrides,
    } as OrderEntity;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    receiptsService.createToken.mockResolvedValue('receipt-token-1');
    receiptsService.getTokenByOrderId.mockResolvedValue('receipt-token-1');

    service = new CheckoutService(
      ordersService as never,
      paymentsService as never,
      inventoryService as never,
      taxService as never,
      receiptsService as never,
      pricingService as never,
      dataSource as never,
      eventEmitter as never,
    );
  });

  it('replays completed result when header idempotency key matches existing order client event id', async () => {
    const order = makeCompletedOrder();
    ordersService.getOrder.mockResolvedValue(order);

    const result = await service.complete(
      order.id,
      order.tenantId,
      order.createdBy,
      { payments: [] },
      'evt-00000000-0000-4000-8000-000000000001',
    );

    expect(result.order.id).toBe(order.id);
    expect(result.receiptToken).toBe('receipt-token-1');
    expect(result.receiptUrl).toContain('/receipts/html/receipt-token-1');

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(ordersService.validateCompletable).not.toHaveBeenCalled();
    expect(ordersService.transition).not.toHaveBeenCalled();
  });

  it('replays completed result when dto.client_event_id matches and header is missing', async () => {
    const order = makeCompletedOrder();
    ordersService.getOrder.mockResolvedValue(order);

    const result = await service.complete(order.id, order.tenantId, order.createdBy, {
      client_event_id: 'evt-00000000-0000-4000-8000-000000000001',
      payments: [],
    });

    expect(result.order.id).toBe(order.id);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('throws conflict when completed order is called with a different idempotency key', async () => {
    const order = makeCompletedOrder();
    ordersService.getOrder.mockResolvedValue(order);

    await expect(
      service.complete(order.id, order.tenantId, order.createdBy, { payments: [] }, 'evt-00000000-0000-4000-8000-000000000999'),
    ).rejects.toThrow(ConflictException);

    await expect(
      service.complete(order.id, order.tenantId, order.createdBy, { payments: [] }, 'evt-00000000-0000-4000-8000-000000000999'),
    ).rejects.toThrow('Idempotency key conflict for already completed order');

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('throws conflict when completed order has no replay key on request', async () => {
    const order = makeCompletedOrder();
    ordersService.getOrder.mockResolvedValue(order);

    await expect(service.complete(order.id, order.tenantId, order.createdBy, { payments: [] })).rejects.toThrow(
      'Order is already completed',
    );

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
