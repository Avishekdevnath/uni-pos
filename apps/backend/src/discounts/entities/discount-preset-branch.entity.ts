import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { DiscountPresetEntity } from './discount-preset.entity';
import { BranchEntity } from '../../database/entities/branch.entity';

@Entity({ name: 'discount_preset_branches' })
@Unique('discount_preset_branches_preset_branch_unique', ['discountPresetId', 'branchId'])
export class DiscountPresetBranchEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'discount_preset_id', type: 'uuid' })
  discountPresetId!: string;

  @ManyToOne(() => DiscountPresetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discount_preset_id' })
  discountPreset!: DiscountPresetEntity;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => BranchEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'branch_id' })
  branch!: BranchEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
