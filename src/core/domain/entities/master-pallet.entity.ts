import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('m_pallet')
export class MasterPallet extends BaseEntity {

  @Column({ nullable: true })
  organization_id: number;

  @Column({ nullable: true })
  pallet_code: string;

  @Column({ nullable: true })
  capacity: number;

  @Column({ nullable: true })
  barcode_image_url: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_empty', default: false })
  isEmpty: boolean;
} 