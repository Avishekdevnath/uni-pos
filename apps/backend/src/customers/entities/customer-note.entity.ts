import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CustomerEntity } from './customer.entity';
import { UserEntity } from '../../users/entities/user.entity/user.entity';

@Entity({ name: 'customer_notes' })
@Index('customer_notes_customer_id_index', ['customerId'])
export class CustomerNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => CustomerEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: CustomerEntity;

  @Index()
  @Column({ name: 'staff_id', type: 'uuid' })
  staffId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'staff_id' })
  staff!: UserEntity;

  @Column({ type: 'text' })
  note!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
