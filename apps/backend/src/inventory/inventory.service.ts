import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { InventoryBatchEntity } from './entities/inventory-batch.entity';
import { InventoryMovementEntity } from './entities/inventory-movement.entity';
import { InventoryBalanceEntity } from './entities/inventory-balance.entity';
import { BranchProductConfigEntity } from './entities/branch-product-config.entity';

import { CreateStockInDto } from './dto/create-stock-in.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { ListBalancesQueryDto } from './dto/list-balances-query.dto';
import { ListMovementsQueryDto } from './dto/list-movements-query.dto';
import { UpdateBranchProductConfigDto } from './dto/update-branch-product-config.dto';

// Stub types — full event classes defined in Task 39
interface StockInEventPayload {
  tenantId: string;
  branchId: string;
  batchId: string;
  items: { productId: string; quantity: number }[];
}
interface LowStockEventPayload {
  tenantId: string;
  branchId: string;
  productId: string;
  currentStock: number;
  threshold: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryBatchEntity)
    private batchRepo: Repository<InventoryBatchEntity>,
    @InjectRepository(InventoryMovementEntity)
    private movementRepo: Repository<InventoryMovementEntity>,
    @InjectRepository(InventoryBalanceEntity)
    private balanceRepo: Repository<InventoryBalanceEntity>,
    @InjectRepository(BranchProductConfigEntity)
    private configRepo: Repository<BranchProductConfigEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Basic Query Methods ─────────────────────────────────────────────────────

  async listBalances(
    tenantId: string,
    query: ListBalancesQueryDto,
  ): Promise<InventoryBalanceEntity[]> {
    const where: Record<string, unknown> = {
      tenantId,
      branchId: query.branch_id,
    };
    if (query.product_id) {
      where['productId'] = query.product_id;
    }
    return this.balanceRepo.find({
      where,
      relations: ['product'],
    });
  }

  async listMovements(
    tenantId: string,
    query: ListMovementsQueryDto,
  ): Promise<InventoryMovementEntity[]> {
    const qb = this.movementRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.branchId = :branchId', { branchId: query.branch_id })
      .orderBy('m.createdAt', 'DESC');

    if (query.product_id) {
      qb.andWhere('m.productId = :productId', { productId: query.product_id });
    }
    if (query.movement_type) {
      qb.andWhere('m.movementType = :movementType', {
        movementType: query.movement_type,
      });
    }
    if (query.from) {
      qb.andWhere('m.createdAt >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('m.createdAt <= :to', { to: query.to });
    }

    return qb.getMany();
  }

  async getConfig(
    tenantId: string,
    branchId: string,
    productId: string,
  ): Promise<BranchProductConfigEntity | null> {
    return this.configRepo.findOne({
      where: { tenantId, branchId, productId },
    });
  }

  async upsertConfig(
    tenantId: string,
    branchId: string,
    productId: string,
    dto: UpdateBranchProductConfigDto,
  ): Promise<BranchProductConfigEntity> {
    let config = await this.configRepo.findOne({
      where: { tenantId, branchId, productId },
    });

    if (!config) {
      config = this.configRepo.create({ tenantId, branchId, productId });
    }

    if (dto.low_stock_threshold !== undefined) {
      config.lowStockThreshold = dto.low_stock_threshold;
    }
    if (dto.is_available !== undefined) {
      config.isAvailable = dto.is_available;
    }

    return this.configRepo.save(config);
  }

  // ─── createStockIn ───────────────────────────────────────────────────────────

  async createStockIn(
    tenantId: string,
    userId: string,
    dto: CreateStockInDto,
  ): Promise<{ batch: InventoryBatchEntity; eventPayload: StockInEventPayload }> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Create batch record
      const batch = manager.create(InventoryBatchEntity, {
        tenantId,
        branchId: dto.branch_id,
        type: 'stock_in',
        description: dto.description ?? null,
        status: 'completed',
        createdBy: userId,
      });
      await manager.save(batch);

      // 2. For each item: create movement + update balance
      const movements: InventoryMovementEntity[] = [];
      for (const item of dto.items) {
        // idempotency: skip if clientEventId already exists
        if (item.client_event_id) {
          const existing = await manager.findOne(InventoryMovementEntity, {
            where: { clientEventId: item.client_event_id },
          });
          if (existing) continue;
        }

        const movement = manager.create(InventoryMovementEntity, {
          tenantId,
          branchId: dto.branch_id,
          productId: item.product_id,
          movementType: 'stock_in',
          quantity: item.quantity,
          unitCost: item.unit_cost ?? null,
          batchId: batch.id,
          clientEventId: item.client_event_id ?? null,
        });
        await manager.save(movement);
        movements.push(movement);
        await this.updateBalance(
          manager,
          tenantId,
          dto.branch_id,
          item.product_id,
          item.quantity,
        );
      }

      const eventPayload: StockInEventPayload = {
        tenantId,
        branchId: dto.branch_id,
        batchId: batch.id,
        items: movements.map((m) => ({
          productId: m.productId,
          quantity: m.quantity,
        })),
      };

      return { batch, eventPayload };
    });
  }

  // ─── createAdjustment ───────────────────────────────────────────────────────

  async createAdjustment(
    tenantId: string,
    userId: string,
    dto: CreateAdjustmentDto,
  ): Promise<{ batch: InventoryBatchEntity; eventPayload: StockInEventPayload }> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Create batch record
      const batch = manager.create(InventoryBatchEntity, {
        tenantId,
        branchId: dto.branch_id,
        type: 'adjustment',
        description: dto.description ?? null,
        status: 'completed',
        createdBy: userId,
      });
      await manager.save(batch);

      // 2. For each item: create movement + update balance
      const movements: InventoryMovementEntity[] = [];
      for (const item of dto.items) {
        // idempotency: skip if clientEventId already exists
        if (item.client_event_id) {
          const existing = await manager.findOne(InventoryMovementEntity, {
            where: { clientEventId: item.client_event_id },
          });
          if (existing) continue;
        }

        const movement = manager.create(InventoryMovementEntity, {
          tenantId,
          branchId: dto.branch_id,
          productId: item.product_id,
          movementType: 'adjustment',
          quantity: item.quantity, // signed delta
          unitCost: null,
          batchId: batch.id,
          clientEventId: item.client_event_id ?? null,
          note: item.note ?? null,
        });
        await manager.save(movement);
        movements.push(movement);
        await this.updateBalance(
          manager,
          tenantId,
          dto.branch_id,
          item.product_id,
          item.quantity,
        );
      }

      const eventPayload: StockInEventPayload = {
        tenantId,
        branchId: dto.branch_id,
        batchId: batch.id,
        items: movements.map((m) => ({
          productId: m.productId,
          quantity: m.quantity,
        })),
      };

      return { batch, eventPayload };
    });
  }

  // ─── deductStock (called by checkout orchestrator in same transaction) ───────

  async deductStock(
    manager: EntityManager,
    tenantId: string,
    branchId: string,
    items: Array<{ productId: string; quantity: number; orderId: string }>,
  ): Promise<LowStockEventPayload[]> {
    const lowStockEvents: LowStockEventPayload[] = [];

    for (const item of items) {
      // 1. Create movement record
      const movement = manager.create(InventoryMovementEntity, {
        tenantId,
        branchId,
        productId: item.productId,
        movementType: 'sale_out',
        quantity: -item.quantity,
        orderId: item.orderId,
      });
      await manager.save(movement);

      // 2. Atomic balance upsert with zero-stock guard
      const result = await manager.query(
        `INSERT INTO inventory_balances (tenant_id, branch_id, product_id, on_hand_qty, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (tenant_id, branch_id, product_id)
         DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $4,
                       updated_at = NOW()
         WHERE inventory_balances.on_hand_qty + $4 >= 0`,
        [tenantId, branchId, item.productId, -item.quantity],
      );

      if (result[1] === 0) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.productId}`,
        );
      }

      // 3. Check for low stock threshold
      const config = await manager.findOne(BranchProductConfigEntity, {
        where: { tenantId, branchId, productId: item.productId },
      });
      if (config?.lowStockThreshold != null) {
        const balance = await manager.findOne(InventoryBalanceEntity, {
          where: { tenantId, branchId, productId: item.productId },
        });
        if (balance && balance.onHandQty <= config.lowStockThreshold) {
          lowStockEvents.push({
            tenantId,
            branchId,
            productId: item.productId,
            currentStock: balance.onHandQty,
            threshold: config.lowStockThreshold,
          });
        }
      }
    }

    return lowStockEvents;
  }

  // ─── updateBalance (private helper) ─────────────────────────────────────────

  private async updateBalance(
    manager: EntityManager,
    tenantId: string,
    branchId: string,
    productId: string,
    signedQty: number,
  ): Promise<void> {
    await manager.query(
      `INSERT INTO inventory_balances (tenant_id, branch_id, product_id, on_hand_qty, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (tenant_id, branch_id, product_id)
       DO UPDATE SET on_hand_qty = inventory_balances.on_hand_qty + $4,
                     updated_at = NOW()
       WHERE inventory_balances.on_hand_qty + $4 >= 0`,
      [tenantId, branchId, productId, signedQty],
    );
  }
}
