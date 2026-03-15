import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxGroupEntity } from './entities/tax-group.entity';
import { TaxConfigEntity } from './entities/tax-config.entity';
import { BranchEntity } from '../database/entities/branch.entity';
import { CreateTaxGroupDto } from './dto/create-tax-group.dto';
import { UpdateTaxGroupDto } from './dto/update-tax-group.dto';
import { CreateTaxConfigDto } from './dto/create-tax-config.dto';
import { UpdateTaxConfigDto } from './dto/update-tax-config.dto';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxGroupEntity)
    private readonly taxGroupRepository: Repository<TaxGroupEntity>,
    @InjectRepository(TaxConfigEntity)
    private readonly taxConfigRepository: Repository<TaxConfigEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  // --- Tax Group CRUD ---

  async listGroups(tenantId: string): Promise<TaxGroupEntity[]> {
    return this.taxGroupRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createGroup(tenantId: string, dto: CreateTaxGroupDto): Promise<TaxGroupEntity> {
    const group = this.taxGroupRepository.create({
      tenantId,
      name: dto.name,
    });
    return this.taxGroupRepository.save(group);
  }

  async updateGroup(tenantId: string, id: string, dto: UpdateTaxGroupDto): Promise<TaxGroupEntity> {
    const group = await this.findGroupById(tenantId, id);

    if (group === null) {
      throw new NotFoundException('Tax group not found');
    }

    if (dto.name !== undefined) {
      group.name = dto.name;
    }

    if (dto.status !== undefined) {
      group.status = dto.status;
    }

    return this.taxGroupRepository.save(group);
  }

  async archiveGroup(tenantId: string, id: string): Promise<TaxGroupEntity> {
    const group = await this.taxGroupRepository.findOne({ where: { id, tenantId } });

    if (!group) {
      throw new NotFoundException('Tax group not found');
    }

    group.status = 'inactive';
    return this.taxGroupRepository.save(group);
  }

  async findGroupById(tenantId: string, id: string): Promise<TaxGroupEntity | null> {
    return this.taxGroupRepository.findOne({ where: { id, tenantId } });
  }

  // --- Tax Config CRUD ---

  async listConfigs(tenantId: string, branchId: string): Promise<TaxConfigEntity[]> {
    return this.taxConfigRepository.find({
      where: { tenantId, branchId },
      relations: ['taxGroup'],
      order: { sortOrder: 'ASC' },
    });
  }

  async createConfig(tenantId: string, dto: CreateTaxConfigDto): Promise<TaxConfigEntity> {
    const branch = await this.branchRepository.findOne({
      where: { id: dto.branch_id, tenantId },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    const taxGroup = await this.taxGroupRepository.findOne({
      where: { id: dto.tax_group_id, tenantId },
    });

    if (!taxGroup) {
      throw new NotFoundException('Tax group not found');
    }

    const config = this.taxConfigRepository.create({
      tenantId,
      branchId: dto.branch_id,
      taxGroupId: dto.tax_group_id,
      name: dto.name,
      rate: dto.rate,
      isInclusive: dto.is_inclusive ?? false,
      sortOrder: dto.sort_order ?? 0,
    });

    return this.taxConfigRepository.save(config);
  }

  async updateConfig(tenantId: string, id: string, dto: UpdateTaxConfigDto): Promise<TaxConfigEntity> {
    const config = await this.taxConfigRepository.findOne({ where: { id, tenantId } });

    if (!config) {
      throw new NotFoundException('Tax config not found');
    }

    if (dto.name !== undefined) {
      config.name = dto.name;
    }

    if (dto.rate !== undefined) {
      config.rate = dto.rate;
    }

    if (dto.is_inclusive !== undefined) {
      config.isInclusive = dto.is_inclusive;
    }

    if (dto.sort_order !== undefined) {
      config.sortOrder = dto.sort_order;
    }

    if (dto.status !== undefined) {
      config.status = dto.status;
    }

    return this.taxConfigRepository.save(config);
  }

  async archiveConfig(tenantId: string, id: string): Promise<TaxConfigEntity> {
    const config = await this.taxConfigRepository.findOne({ where: { id, tenantId } });

    if (!config) {
      throw new NotFoundException('Tax config not found');
    }

    config.status = 'inactive';
    return this.taxConfigRepository.save(config);
  }

  // --- Tax Resolution (used by checkout) ---

  async resolveProductTaxes(
    tenantId: string,
    branchId: string,
    productTaxGroupId: string | null,
  ): Promise<TaxConfigEntity[]> {
    if (!productTaxGroupId) return []; // tax-exempt
    return this.taxConfigRepository.find({
      where: { tenantId, branchId, taxGroupId: productTaxGroupId, status: 'active' },
      order: { sortOrder: 'ASC' },
    });
  }
}
