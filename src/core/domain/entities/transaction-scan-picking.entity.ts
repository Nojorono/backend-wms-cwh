import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PickingTransaction } from './transaction-picking.entity';
import { MasterPallet } from './master-pallet.entity';

export enum ScanPickingStatus {
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
  inspection_by: string;
}
