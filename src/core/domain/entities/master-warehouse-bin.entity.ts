import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { InventoryTracking } from './inventory-tracking.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';
import { BaseEntity } from './base.entity';

@Entity('m_warehouse_bin')
export class MasterWarehouseBin extends BaseEntity {
  @Column({ nullable: true, name: 'locator_id' })
  locator_id: number;

  @Column({ nullable: true, name: 'locator_name' })
  locator_name: string;

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

  @Column({ nullable: true, name: 'current_pallet' })
  current_pallet: number;

  @OneToMany(() => InventoryTracking, (inventoryTracking) => inventoryTracking.warehouseBin)
  inventory_trackings: InventoryTracking[];

  @ManyToOne(() => MasterWarehouseSub, (warehouseSub) => warehouseSub.id)
  @JoinColumn({ name: 'warehouse_sub_id' })
  warehouseSub: MasterWarehouseSub;
}
