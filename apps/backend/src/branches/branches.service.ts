import { Injectable } from '@nestjs/common';
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
}
