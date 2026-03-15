import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateDiscountPresetDto } from './dto/create-discount-preset.dto';
import { ListDiscountPresetsQueryDto } from './dto/list-discount-presets-query.dto';
import { UpdateDiscountPresetDto } from './dto/update-discount-preset.dto';
import { DiscountPresetBranchEntity } from './entities/discount-preset-branch.entity';
import { DiscountPresetEntity } from './entities/discount-preset.entity';

// Minimal interface for order discount entries — full entity defined in Task 28.
export interface OrderDiscountLike {
  scope: string;
  isCombinable: boolean;
  presetId?: string;
}

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(DiscountPresetEntity)
    private readonly presetRepository: Repository<DiscountPresetEntity>,
    @InjectRepository(DiscountPresetBranchEntity)
    private readonly branchRepository: Repository<DiscountPresetBranchEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    tenantId: string,
    query: ListDiscountPresetsQueryDto,
  ): Promise<DiscountPresetEntity[]> {
    const now = new Date();

    const qb = this.presetRepository
      .createQueryBuilder('preset')
      .where('preset.tenant_id = :tenantId', { tenantId });

    if (query.status) {
      qb.andWhere('preset.status = :status', { status: query.status });
    } else {
      qb.andWhere('preset.status = :status', { status: 'active' })
        .andWhere(
          '(preset.valid_from IS NULL OR preset.valid_from <= :now)',
          { now },
        )
        .andWhere(
          '(preset.valid_until IS NULL OR preset.valid_until >= :now)',
          { now },
        );
    }

    if (query.branch_id) {
      qb.andWhere(
        `(
          (SELECT COUNT(*) FROM discount_preset_branches dpb
           WHERE dpb.discount_preset_id = preset.id) = 0
          OR EXISTS (
            SELECT 1 FROM discount_preset_branches dpb2
            WHERE dpb2.discount_preset_id = preset.id
              AND dpb2.branch_id = :branchId
          )
        )`,
        { branchId: query.branch_id },
      );
    }

    if (query.scope) {
      qb.andWhere('preset.scope = :scope', { scope: query.scope });
    }

    qb.orderBy('preset.created_at', 'DESC')
      .skip((query.page - 1) * query.page_size)
      .take(query.page_size);

    return qb.getMany();
  }

  async create(
    tenantId: string,
    dto: CreateDiscountPresetDto,
  ): Promise<DiscountPresetEntity> {
    const preset = this.presetRepository.create({
      tenantId,
      name: dto.name,
      type: dto.type,
      value: dto.value,
      scope: dto.scope,
      maxDiscountAmount: dto.max_discount_amount ?? null,
      minOrderAmount: dto.min_order_amount ?? null,
      validFrom: dto.valid_from ? new Date(dto.valid_from) : null,
      validUntil: dto.valid_until ? new Date(dto.valid_until) : null,
      isCombinable: dto.is_combinable ?? true,
      status: 'active',
    });

    return this.presetRepository.save(preset);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateDiscountPresetDto,
  ): Promise<DiscountPresetEntity> {
    const preset = await this.findByIdOrThrow(tenantId, id);

    if (dto.name !== undefined) preset.name = dto.name;
    if (dto.type !== undefined) preset.type = dto.type;
    if (dto.value !== undefined) preset.value = dto.value;
    if (dto.scope !== undefined) preset.scope = dto.scope;
    if (dto.max_discount_amount !== undefined)
      preset.maxDiscountAmount = dto.max_discount_amount ?? null;
    if (dto.min_order_amount !== undefined)
      preset.minOrderAmount = dto.min_order_amount ?? null;
    if (dto.valid_from !== undefined)
      preset.validFrom = dto.valid_from ? new Date(dto.valid_from) : null;
    if (dto.valid_until !== undefined)
      preset.validUntil = dto.valid_until ? new Date(dto.valid_until) : null;
    if (dto.is_combinable !== undefined) preset.isCombinable = dto.is_combinable;
    if (dto.status !== undefined) preset.status = dto.status;

    return this.presetRepository.save(preset);
  }

  async archive(tenantId: string, id: string): Promise<DiscountPresetEntity> {
    const preset = await this.findByIdOrThrow(tenantId, id);
    preset.status = 'inactive';
    return this.presetRepository.save(preset);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<DiscountPresetEntity | null> {
    return this.presetRepository.findOne({ where: { tenantId, id } });
  }

  async setBranches(
    tenantId: string,
    presetId: string,
    branchIds: string[],
  ): Promise<void> {
    // Confirm preset belongs to this tenant before touching branch rows.
    await this.findByIdOrThrow(tenantId, presetId);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(DiscountPresetBranchEntity, { discountPresetId: presetId });

      if (branchIds.length > 0) {
        const rows = branchIds.map((branchId) =>
          manager.create(DiscountPresetBranchEntity, { discountPresetId: presetId, branchId }),
        );
        await manager.save(DiscountPresetBranchEntity, rows);
      }
    });
  }

  /**
   * Validates that a discount preset can be applied to an order.
   *
   * @param existingDiscounts - OrderDiscountEntity[] from Task 28; typed loosely until that entity exists.
   */
  async validatePresetApplicable(
    tenantId: string,
    branchId: string,
    presetId: string,
    existingDiscounts: OrderDiscountLike[],
  ): Promise<DiscountPresetEntity> {
    const preset = await this.presetRepository.findOne({
      where: { tenantId, id: presetId },
    });

    if (!preset) {
      throw new NotFoundException(`Discount preset ${presetId} not found`);
    }

    if (preset.status !== 'active') {
      throw new BadRequestException(
        `Discount preset "${preset.name}" is not active`,
      );
    }

    // Validity window check.
    const now = new Date();
    if (preset.validFrom && preset.validFrom > now) {
      throw new BadRequestException(
        `Discount preset "${preset.name}" is not yet valid`,
      );
    }
    if (preset.validUntil && preset.validUntil < now) {
      throw new BadRequestException(
        `Discount preset "${preset.name}" has expired`,
      );
    }

    // Branch assignment check: zero rows = available to all branches.
    const branchCount = await this.branchRepository.count({
      where: { discountPresetId: presetId },
    });

    if (branchCount > 0) {
      const assigned = await this.branchRepository.findOne({
        where: { discountPresetId: presetId, branchId },
      });
      if (!assigned) {
        throw new BadRequestException(
          `Discount preset "${preset.name}" is not available at this branch`,
        );
      }
    }

    // Combinability check — scope boundaries are independent.
    const sameScope = existingDiscounts.filter((d) => d.scope === preset.scope);

    if (!preset.isCombinable && sameScope.length > 0) {
      throw new BadRequestException(
        `Discount preset "${preset.name}" cannot be combined with other ${preset.scope}-level discounts`,
      );
    }

    const blockingExisting = sameScope.find((d) => !d.isCombinable);
    if (blockingExisting) {
      throw new BadRequestException(
        `An existing ${preset.scope}-level discount does not allow additional discounts`,
      );
    }

    return preset;
  }

  // Internal helper — throws NotFoundException when the preset is missing.
  private async findByIdOrThrow(
    tenantId: string,
    id: string,
  ): Promise<DiscountPresetEntity> {
    const preset = await this.findById(tenantId, id);
    if (!preset) {
      throw new NotFoundException(`Discount preset ${id} not found`);
    }
    return preset;
  }
}
