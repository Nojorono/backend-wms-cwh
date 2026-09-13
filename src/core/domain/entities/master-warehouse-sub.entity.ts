import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InventoryTracking } from './inventory-tracking.entity';

export enum WarehouseSubStagingType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

@Entity('m_warehouse_sub')
export class MasterWarehouseSub extends BaseEntity {
  @Column({ nullable: true, name: 'locator_id' })
  locator_id: number;

  @Column({ nullable: true, name: 'locator_name' })
  locator_name: string;

  @Column({ nullable: true, name: 'warehouse_id' })
  warehouse_id: string;

  @Column({ nullable: true, name: 'name' })
  name: string;

  @Column({ nullable: true, name: 'code' })
  code: string;

  @Column({ nullable: true, name: 'description' })
  description: string;

  @Column({ nullable: true, name: 'capacity_bin' })
  capacity_bin: number;

  @Column({ nullable: true, name: 'is_staging' })
  is_staging: WarehouseSubStagingType;

  @Column({ nullable: true, name: 'is_good_stock', default: true })
  is_good_stock: boolean;

  @Column({ nullable: true, name: 'is_gate', default: false })
  is_gate: boolean;

  @OneToMany(() => InventoryTracking, (inventoryTracking) => inventoryTracking.warehouseSub)
  inventory_trackings: InventoryTracking[];
}
