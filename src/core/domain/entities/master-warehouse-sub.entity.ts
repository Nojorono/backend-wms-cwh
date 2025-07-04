import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('m_warehouse_sub')
export class MasterWarehouseSub {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, name: 'organization_id' })
  organization_id: number;

  @Column({ nullable: true, name: 'warehouse_id' })
  warehouse_id: string;

  @Column({ nullable: true, name: 'name' })
  name: string;

  @Column({ nullable: true, name: 'code' })
  code: string;

  @Column({ nullable: true, name: 'description' })
  description: string;

  @Column({ nullable: true, name: 'capacity' })
  capacity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 