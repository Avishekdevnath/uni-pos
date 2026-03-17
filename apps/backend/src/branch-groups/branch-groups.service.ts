import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchGroupEntity } from './entities/branch-group.entity';
import { BranchGroupMemberEntity } from './entities/branch-group-member.entity';
import { CreateBranchGroupDto } from './dto/create-branch-group.dto';
import { UpdateBranchGroupDto } from './dto/update-branch-group.dto';

@Injectable()
export class BranchGroupsService {
  constructor(
    @InjectRepository(BranchGroupEntity)
    private readonly groupRepo: Repository<BranchGroupEntity>,
    @InjectRepository(BranchGroupMemberEntity)
    private readonly memberRepo: Repository<BranchGroupMemberEntity>,
  ) {}

  private async getDepth(groupId: string): Promise<number> {
    let depth = 0;
    let current = await this.groupRepo.findOne({ where: { id: groupId } });
    while (current?.parentId) {
      depth++;
      if (depth > 3) break;
      current = await this.groupRepo.findOne({ where: { id: current.parentId } });
    }
    return depth;
  }

  async list(tenantId: string): Promise<BranchGroupEntity[]> {
    return this.groupRepo.find({ where: { tenantId } });
  }

  async findOne(id: string, tenantId: string): Promise<BranchGroupEntity> {
    const group = await this.groupRepo.findOne({ where: { id, tenantId } });
    if (!group) throw new NotFoundException(`BranchGroup ${id} not found`);
    return group;
  }

  async create(tenantId: string, dto: CreateBranchGroupDto): Promise<BranchGroupEntity> {
    if (dto.parent_id) {
      const parent = await this.groupRepo.findOne({ where: { id: dto.parent_id, tenantId } });
      if (!parent) throw new NotFoundException(`Parent group ${dto.parent_id} not found`);
      const parentDepth = await this.getDepth(dto.parent_id);
      // parent at depth N means child will be at depth N+1; max allowed depth index is 2 (root=0, child=1, grandchild=2)
      if (parentDepth >= 2) {
        throw new BadRequestException('Maximum group nesting depth of 3 exceeded');
      }
    }

    const group = this.groupRepo.create({
      tenantId,
      name: dto.name,
      parentId: dto.parent_id ?? null,
    });
    return this.groupRepo.save(group);
  }

  async update(id: string, tenantId: string, dto: UpdateBranchGroupDto): Promise<BranchGroupEntity> {
    const group = await this.findOne(id, tenantId);

    if (dto.parent_id !== undefined) {
      if (dto.parent_id === id) {
        throw new BadRequestException('A group cannot be its own parent');
      }
      if (dto.parent_id) {
        const parent = await this.groupRepo.findOne({ where: { id: dto.parent_id, tenantId } });
        if (!parent) throw new NotFoundException(`Parent group ${dto.parent_id} not found`);
        const parentDepth = await this.getDepth(dto.parent_id);
        if (parentDepth >= 2) {
          throw new BadRequestException('Maximum group nesting depth of 3 exceeded');
        }
      }
      group.parentId = dto.parent_id ?? null;
    }

    if (dto.name !== undefined) group.name = dto.name;
    return this.groupRepo.save(group);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const group = await this.findOne(id, tenantId);
    await this.groupRepo.remove(group);
  }

  async addMember(groupId: string, branchId: string, tenantId: string): Promise<BranchGroupMemberEntity> {
    await this.findOne(groupId, tenantId);

    const existing = await this.memberRepo.findOne({ where: { branchGroupId: groupId, branchId } });
    if (existing) throw new ConflictException('Branch is already a member of this group');

    const member = this.memberRepo.create({ branchGroupId: groupId, branchId });
    return this.memberRepo.save(member);
  }

  async removeMember(groupId: string, branchId: string, tenantId: string): Promise<void> {
    await this.findOne(groupId, tenantId);
    const member = await this.memberRepo.findOne({ where: { branchGroupId: groupId, branchId } });
    if (!member) throw new NotFoundException('Branch is not a member of this group');
    await this.memberRepo.remove(member);
  }
}
