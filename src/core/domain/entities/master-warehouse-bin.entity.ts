import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('m_warehouse_bin')
export class MasterWarehouseBin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, name: 'organization_id' })
  organization_id: number;

  @Column({ nullable: true, name: 'warehouse_sub_id' })
  warehouse_sub_id: string;

  @Column({ nullable: true, name: 'name' })
  name: string;

  @Column({ nullable: true, name: 'code' })
  code: string;

  @Column({ nullable: true, name: 'description' })
  description: string;

  @Column({ nullable: true, name: 'capacity_pallet' })
  capacity_pallet: number;

  @Column({ nullable: true, name: 'barcode_image_url' })
  barcode_image_url: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 