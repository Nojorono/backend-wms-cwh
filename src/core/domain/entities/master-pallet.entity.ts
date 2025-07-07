import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('m_pallet')
export class MasterPallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  organization_id: number;

  @Column({ nullable: true })
  pallet_code: string;

  @Column()
  uom_name: string;

  @Column({ nullable: true })
  capacity: number;

  @Column({ nullable: true })
  barcode_image_url: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_empty', default: false })
  isEmpty: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 