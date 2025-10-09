import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterWarehouse } from './master-warehouse.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';
import { MasterWarehouseBin } from './master-warehouse-bin.entity';

export enum ProgressionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}


@Entity('inventory_tracking')
export class InventoryTracking extends BaseEntity {
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

  @Column({ nullable: true })
  inventory_date: Date;

  @Column({ nullable: true })
  inventory_status: string;

  @Column({ nullable: true, default: ProgressionStatus.NOT_STARTED })
  progression_status: ProgressionStatus;

  @Column({ nullable: true })
  inventory_note: string;
}
