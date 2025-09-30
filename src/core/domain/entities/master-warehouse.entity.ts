import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InventoryTracking } from './inventory-tracking.entity';

@Entity('m_warehouse')
export class MasterWarehouse extends BaseEntity {
  @Column({ nullable: true })
  organization_id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => InventoryTracking, (inventoryTracking) => inventoryTracking.warehouse)
  inventory_trackings: InventoryTracking[];
}
