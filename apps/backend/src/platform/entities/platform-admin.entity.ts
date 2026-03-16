import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('platform_admins')
export class PlatformAdminEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 255, unique: true }) email!: string;
  @Column({ name: 'password_hash', type: 'varchar', length: 255 }) passwordHash!: string;
  @Column({ name: 'full_name', type: 'varchar', length: 255 }) fullName!: string;
  @Column({ type: 'varchar', length: 32, default: 'active' }) status!: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt!: Date;
}
