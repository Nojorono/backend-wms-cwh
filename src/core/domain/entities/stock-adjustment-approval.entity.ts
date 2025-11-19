import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterItem } from './master-item.entity';
import { Approval } from './approval.entity';

@Entity('stock_adjustment_approval')
export class StockAdjustmentApproval extends BaseEntity {
  @Column({ nullable: true })
  approval_id: string;

  @OneToOne(() => Approval, { nullable: true })
  @JoinColumn({ name: 'approval_id' })
  approval: Approval;

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

  @Column({ nullable: true })
  target_pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id)
  @JoinColumn({ name: 'target_pallet_id' })
  target_pallet: MasterPallet;
}

