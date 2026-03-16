import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BranchGroupEntity } from './branch-group.entity';
import { BranchEntity } from '../../database/entities/branch.entity';

@Entity('branch_group_members')
export class BranchGroupMemberEntity {
  @PrimaryColumn({ name: 'branch_group_id', type: 'uuid' }) branchGroupId!: string;
  @PrimaryColumn({ name: 'branch_id', type: 'uuid' }) branchId!: string;
  @ManyToOne(() => BranchGroupEntity, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branch_group_id' }) branchGroup!: BranchGroupEntity;
  @ManyToOne(() => BranchEntity, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branch_id' }) branch!: BranchEntity;
}
