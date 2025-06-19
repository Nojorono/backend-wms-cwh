import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('m_io')
export class MasterIO {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  organization_id: number;

  @Column({ nullable: true })
  organization_name: string;

  @Column({ nullable: true })
  operating_unit: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 