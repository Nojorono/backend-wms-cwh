import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ApprovalSetup } from './approval-setup.entity';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
}

export enum EntityType {
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  MOVE_ORDER = 'MOVE_ORDER',
  OUTBOUND_MEMO = 'OUTBOUND_MEMO',
  INBOUND = 'INBOUND',
  CUSTOM = 'CUSTOM',
}

@Entity('approval')
export class Approval extends BaseEntity {
  @Column({
    nullable: true,
    type: 'enum',
    enum: ['STOCK_ADJUSTMENT', 'MOVE_ORDER', 'OUTBOUND_MEMO', 'INBOUND', 'CUSTOM'],
  })
  entity_type: EntityType;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ type: 'jsonb', nullable: true })
  entity_data: Record<string, any>;

  @Column({ nullable: true })
  approval_setup_id: string;

  @ManyToOne(() => ApprovalSetup, (setup) => setup.approvals)
  @JoinColumn({ name: 'approval_setup_id' })
  approval_setup: ApprovalSetup;

  @Column({
    nullable: true,
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'PARTIALLY_APPROVED'],
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ nullable: true })
  current_level: number;

  @Column({ nullable: true })
  requested_by: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  approval_history: Array<{
    level: number;
    level_name: string;
    approved_by: string;
    approved_at: Date;
    comments?: string;
  }>;

  @Column({ nullable: true })
  rejected_by: string;

  @Column({ nullable: true })
  rejected_at: Date;

  @Column({ nullable: true })
  rejection_reason: string;

  @Column({ nullable: true })
  cancelled_by: string;

  @Column({ nullable: true })
  cancelled_at: Date;

  @Column({ nullable: true })
  cancellation_reason: string;
}

