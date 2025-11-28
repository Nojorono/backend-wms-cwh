import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PickingTransaction } from './transaction-picking.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterItem } from './master-item.entity';

export enum ScanPickingStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  INSPECTION = 'INSPECTION',
  INSPECTION_APPROVED = 'INSPECTION_APPROVED',
}

@Entity('transaction_scan_picking')
export class ScanPickingTransaction extends BaseEntity {
  @Column({ nullable: true })
  transaction_picking_id: string;

  @ManyToOne(() => PickingTransaction, (transactionPicking) => transactionPicking.id)
  @JoinColumn({ name: 'transaction_picking_id' })
  transactionPicking: PickingTransaction;

  @Column({ nullable: true })
  pallet_source_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id)
  @JoinColumn({ name: 'pallet_source_id' })
  palletSource: MasterPallet;

  @Column({ nullable: true })
  pallet_use_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id)
  @JoinColumn({ name: 'pallet_use_id' })
  palletUse: MasterPallet;

  @Column({ nullable: true })
  pallet_switch_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id)
  @JoinColumn({ name: 'pallet_switch_id' })
  palletSwitch: MasterPallet;

  @Column({ nullable: true })
  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id)
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true })
  quantity_picked: number;

  @Column({ nullable: true })
  quantity_switch: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true })
  week_number: number;

  @Column({ nullable: true })
  status: ScanPickingStatus;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  user_name: string;

  @Column({ nullable: true })
  inspection_by: string;
}
