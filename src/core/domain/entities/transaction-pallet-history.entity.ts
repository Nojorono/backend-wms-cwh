import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterPallet } from './master-pallet.entity';

export enum QuantityOperationType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  ADJUST = 'ADJUST',
  RESET = 'RESET'
}

@Entity('transaction_pallet_history')
export class PalletTransactionHistory extends BaseEntity {
  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({ nullable: true })
  item_id: string;

  @Column({ type: 'int', default: 0 })
  previous_quantity: number;

  @Column({ type: 'int', default: 0 })
  quantity_change: number;

  @Column({ type: 'int', default: 0 })
  new_quantity: number;

  @Column({ type: 'enum', enum: QuantityOperationType })
  operation_type: QuantityOperationType;

  @Column({ nullable: true })
  production_date: Date;  

  @Column({ nullable: true })
  week_number: number;

  @Column({ nullable: true })
  reference_id: string;

  @Column({ nullable: true })
  reference_type: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  uom: string;
}
