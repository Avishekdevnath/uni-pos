import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 100, unique: true }) code!: string;
  @Column({ type: 'varchar', length: 50 }) resource!: string;
  @Column({ type: 'varchar', length: 50 }) action!: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) description!: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
