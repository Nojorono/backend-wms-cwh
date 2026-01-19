import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ApprovalLevel } from './approval-level.entity';
import { Approval } from './approval.entity';
import { EntityType } from './approval.entity';

@Entity('approval_setup')
export class ApprovalSetup extends BaseEntity {
  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: ['STOCK_ADJUSTMENT', 'MOVE_ORDER', 'OUTBOUND_MEMO', 'INBOUND', 'CUSTOM'],
  })
  entity_type: EntityType;

  @Column({ nullable: true, default: true })
  is_active: boolean;

  @Column({ nullable: true, default: false })
  require_all_levels: boolean;

  @Column({ nullable: true, type: 'int', default: 0 })
  total_levels: number;

  @OneToMany(() => ApprovalLevel, (level) => level.approval_setup, { cascade: true })
  approval_levels: ApprovalLevel[];

  @OneToMany(() => Approval, (approval) => approval.approval_setup)
  approvals: Approval[];
}

