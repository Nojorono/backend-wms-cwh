import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterWarehouseBin } from './master-warehouse-bin.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';
import { OutboundMemo } from './outbound-memo.entity';
import { MasterItem } from './master-item.entity';
import { OutboundDo } from './outbound-do.entity';
import { ScanPickingTransaction } from './transaction-scan-picking.entity';

export enum Status {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('transaction_picking')
export class PickingTransaction extends BaseEntity {
  @Column({ nullable: true })
  do_id: string;

  @ManyToOne(() => OutboundDo, (outboundDo) => outboundDo.id)
  @JoinColumn({ name: 'do_id' })
  do: OutboundDo;

  @Column({ nullable: true })
  memo_id: string;

  @ManyToOne(() => OutboundMemo, (memo) => memo.id)
  @JoinColumn({ name: 'memo_id' })
  memo: OutboundMemo;

  @Column({ nullable: true })
  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id)
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

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
  quantity: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true })
  week_number: number;

  @Column({ nullable: true, default: Status.PENDING })
  status: Status;

  @OneToMany(() => ScanPickingTransaction, (scanPicking) => scanPicking.transactionPicking)
  transactionScanPicking: ScanPickingTransaction[];
}
