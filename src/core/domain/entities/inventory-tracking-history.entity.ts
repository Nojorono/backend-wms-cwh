import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterWarehouse } from './master-warehouse.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';
import { MasterWarehouseBin } from './master-warehouse-bin.entity';
import { InventoryTracking } from './inventory-tracking.entity';

export enum InventoryTrackingAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  LOCATION_CHANGED = 'LOCATION_CHANGED',
  MOVED = 'MOVED',
  PLACED = 'PLACED',
  PICKED = 'PICKED',
}

@Entity('inventory_tracking_history')
export class InventoryTrackingHistory extends BaseEntity {
  @Column({ nullable: true })
  inventory_tracking_id: string;

  @ManyToOne(() => InventoryTracking, (tracking) => tracking.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'inventory_tracking_id' })
  inventoryTracking: InventoryTracking;

  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.inventory_trackings)
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({ nullable: true })
  warehouse_id: string;

  @ManyToOne(() => MasterWarehouse, (warehouse) => warehouse.inventory_trackings)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: MasterWarehouse;

  @Column({ nullable: true })
  warehouse_sub_id: string;

  @ManyToOne(() => MasterWarehouseSub, (warehouseSub) => warehouseSub.inventory_trackings)
  @JoinColumn({ name: 'warehouse_sub_id' })
  warehouseSub: MasterWarehouseSub;

  @Column({ nullable: true })
  warehouse_bin_id: string;

  @ManyToOne(() => MasterWarehouseBin, (warehouseBin) => warehouseBin.inventory_trackings)
  @JoinColumn({ name: 'warehouse_bin_id' })
  warehouseBin: MasterWarehouseBin;

  @Column({ type: 'timestamp', nullable: true })
  inventory_date: Date;

  @Column({ nullable: true })
  inventory_status: string;

  @Column({ nullable: true })
  inventory_note: string;

  @Column({ type: 'varchar', length: 32, nullable: false, default: InventoryTrackingAction.CREATED })
  action: InventoryTrackingAction;

  @Column({ nullable: true })
  inbound_id: string;
}



