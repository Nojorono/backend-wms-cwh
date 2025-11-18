import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterItem } from './master-item.entity';

export enum StockAdjustmentApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('stock_adjustment_approval')
export class StockAdjustmentApproval extends BaseEntity {
  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id)
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({ nullable: true })
  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id)
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true, type: 'int' })
  current_quantity: number;

  @Column({ nullable: true, type: 'int' })
  requested_quantity: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true })
  production_date: Date;

  @Column({ nullable: true, type: 'int' })
  week_number: number;

  @Column({ nullable: true, type: 'enum', enum: StockAdjustmentApprovalStatus, default: StockAdjustmentApprovalStatus.PENDING })
  status: StockAdjustmentApprovalStatus;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  requested_by: string;

  @Column({ nullable: true })
  approved_by: string;

  @Column({ nullable: true })
  approved_at: Date;

  @Column({ nullable: true })
  rejected_by: string;

  @Column({ nullable: true })
  rejected_at: Date;

  @Column({ nullable: true })
  rejection_reason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  target_pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id)
  @JoinColumn({ name: 'target_pallet_id' })
  target_pallet: MasterPallet;
}

