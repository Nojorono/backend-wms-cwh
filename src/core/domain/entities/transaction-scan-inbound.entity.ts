import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Inbound } from './inbound.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterItem } from './master-item.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';

export enum ScanInboundStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

@Entity('transaction_scan_inbound')
export class TransactionScanInbound extends BaseEntity {
  @Column({ nullable: true })
  inbound_id: string;

  @ManyToOne(() => Inbound, (inbound) => inbound.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound;

  @Column({ type: 'date', nullable: true })
  production_date: Date;

  @Column({ nullable: true })
  week_number: number;

  @Column({ nullable: true })
  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  user_name: string;

  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({ nullable: true })
  m_warehouse_sub_id: string;

  @ManyToOne(() => MasterWarehouseSub, (warehouseSub) => warehouseSub.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'm_warehouse_sub_id' })
  warehouseSub: MasterWarehouseSub;

  @Column({ nullable: true })
  status: ScanInboundStatus;

  @Column({ nullable: true })
  inspection_by: string;
}
