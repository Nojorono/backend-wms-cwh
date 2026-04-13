import { Entity, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PalletTransactionHistory } from './transaction-pallet-history.entity';
import { InventoryTracking } from './inventory-tracking.entity';
import { OutboundMemo } from './outbound-memo.entity';
import { MasterIO } from './master-io.entity';
@Entity('m_pallet')
export class MasterPallet extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organization_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ nullable: true })
  pallet_code: string;

  @Column({ nullable: true })
  capacity: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_empty', default: false })
  isFull: boolean;

  @Column({ name: 'uom', nullable: true })
  uom: string;

  @Column({ name: 'current_quantity', type: 'int', default: 0 })
  currentQuantity: number;

  @Column({ name: 'current_week_number', type: 'int', default: 0 })
  currentWeekNumber: number;

  @Column({ name: 'memo_id', nullable: true })
  memo_id: string;

  @ManyToOne(() => OutboundMemo, (memo) => memo.id)
  @JoinColumn({ name: 'memo_id' })
  memo: OutboundMemo;

  @OneToMany(() => PalletTransactionHistory, (history) => history.pallet)
  transactionHistory: PalletTransactionHistory[];

  @OneToMany(() => InventoryTracking, (inventoryTracking) => inventoryTracking.pallet)
  inventory_trackings: InventoryTracking[];
}
