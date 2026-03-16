import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { UserEntity } from './user.entity/user.entity';
import { BranchEntity } from '../../database/entities/branch.entity';

@Entity('user_branches')
export class UserBranchEntity {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId!: string;
  @PrimaryColumn({ name: 'branch_id', type: 'uuid' }) @Index() branchId!: string;
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) user!: UserEntity;
  @ManyToOne(() => BranchEntity, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branch_id' }) branch!: BranchEntity;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
}
