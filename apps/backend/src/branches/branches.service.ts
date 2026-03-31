import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '../database/entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly branchesRepository: Repository<BranchEntity>,
  ) {}

  list(tenantId: string): Promise<BranchEntity[]> {
    return this.branchesRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async updateSettings(
    tenantId: string,
    branchId: string,
    settings: Record<string, unknown>,
  ): Promise<BranchEntity> {
    const branch = await this.branchesRepository.findOne({
      where: { id: branchId, tenantId },
    });
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);

    branch.branchSettings = { ...branch.branchSettings, ...settings };
    return this.branchesRepository.save(branch);
  }
}
