import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('m_vehicle')
export class MasterVehicle extends BaseEntity {

  @Column()
  vehicle_type: string;

  @Column({ nullable: true })
  vehicle_brand: string;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;
} 