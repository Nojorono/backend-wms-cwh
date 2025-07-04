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

  @Column({ nullable: true })
  address: string;

  @CreateDateColumn({ name: 'created_at', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;
} 