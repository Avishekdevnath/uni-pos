import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentEntity } from './entities/payment.entity';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { PaymentItemDto } from '../orders/dto/complete-order.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
  ) {}

  async recordPayments(
    manager: EntityManager,
    order: OrderEntity,
    payments: PaymentItemDto[],
  ): Promise<PaymentEntity[]> {
    // Validate: sum of payment amounts must equal order.totalAmount
    const paymentSum = payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentSum - order.totalAmount) > 0.001) {
      throw new BadRequestException(
        `Payment amount ${paymentSum} does not match order total ${order.totalAmount}`,
      );
    }

    // For cash: cash_tendered must >= amount
    for (const p of payments) {
      if (p.method === 'cash' && p.cash_tendered != null && p.cash_tendered < p.amount) {
        throw new BadRequestException('Cash tendered must be >= payment amount');
      }
    }

    // Insert payment rows
    const saved: PaymentEntity[] = [];
    for (const p of payments) {
      const payment = manager.create(PaymentEntity, {
        orderId: order.id,
        tenantId: order.tenantId,
        branchId: order.branchId,
        method: p.method,
        amount: p.amount,
        cashTendered: p.cash_tendered ?? null,
        status: 'completed',
        clientEventId: p.client_event_id ?? null,
        receivedAt: new Date(),
      });
      await manager.save(payment);
      saved.push(payment);
    }

    // Update order.paid_amount
    order.paidAmount = paymentSum;
    await manager.save(OrderEntity, order);

    return saved;
  }

  async listPayments(tenantId: string, query: ListPaymentsQueryDto): Promise<PaymentEntity[]> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.branchId = :branchId', { branchId: query.branch_id });

    if (query.order_id) qb.andWhere('p.orderId = :orderId', { orderId: query.order_id });
    if (query.from) qb.andWhere('p.receivedAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('p.receivedAt <= :to', { to: query.to });

    return qb.orderBy('p.receivedAt', 'DESC').getMany();
  }
}
