import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InventoryTracking } from './inventory-tracking.entity';
import { MasterWarehouseBin } from './master-warehouse-bin.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';
import { OutboundMemo } from './outbound-memo.entity';
import { MasterItem } from './master-item.entity';

export enum Status {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

@Entity('transaction_picking')
export class PickingTransaction extends BaseEntity {
  memo_id: string;

  @ManyToOne(() => OutboundMemo, (memo) => memo.id)
  @JoinColumn({ name: 'memo_id' })
  memo: OutboundMemo;

  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id)
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true })
  inventory_tracking_id: string;

  @ManyToOne(() => InventoryTracking, (inventoryTracking) => inventoryTracking.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_tracking_id' })
  inventoryTracking: InventoryTracking;

  @Column({ nullable: true })
  source_warehouse_sub_id: string;

  @ManyToOne(() => MasterWarehouseSub, (warehouseSub) => warehouseSub.id)
  @JoinColumn({ name: 'source_warehouse_sub_id' })
  sourceWarehouseSub: MasterWarehouseSub;

  @Column({ nullable: true })
  source_bin_id: string;

  @ManyToOne(() => MasterWarehouseBin, (warehouseBin) => warehouseBin.id)
  @JoinColumn({ name: 'source_bin_id' })
  sourceBin: MasterWarehouseBin;

  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  classification: string;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true, default: Status.PENDING })
  status: Status;
}
