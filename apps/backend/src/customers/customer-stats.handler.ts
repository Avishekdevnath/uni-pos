import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderCompletedEvent } from '../common/events/order.events';
import { OrderEntity } from '../orders/entities/order.entity';
import { CustomersService } from './customers.service';

@Injectable()
export class CustomerStatsHandler {
  private readonly logger = new Logger(CustomerStatsHandler.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly customersService: CustomersService,
  ) {}

  @OnEvent('order.completed', { async: true })
  async handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
    try {
      const order = await this.orderRepo.findOne({
        where: { id: event.orderId },
        select: ['id', 'customerId', 'totalAmount', 'completedAt'],
      });

      if (!order?.customerId) return;

      await this.customersService.updateStats(
        order.customerId,
        Number(order.totalAmount),
        order.completedAt ?? new Date(),
      );
    } catch (err) {
      // Fail-silent: stats update failure must not affect order completion
      this.logger.error(
        `CustomerStatsHandler failed for order ${event.orderId}: ${err}`,
      );
    }
  }
}
