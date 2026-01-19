import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ApprovalSetup } from './approval-setup.entity';
import { Role } from './role.entity';

@Entity('approval_level')
@Index(['approval_setup_id', 'level'], { unique: true })
export class ApprovalLevel extends BaseEntity {
  @Column({ nullable: true })
  approval_setup_id: string;

  @ManyToOne(() => ApprovalSetup, (setup) => setup.approval_levels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'approval_setup_id' })
  approval_setup: ApprovalSetup;

  @Column({ nullable: true, type: 'int' })
  level: number;

  @Column({ nullable: true })
  level_name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  role_id: number;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ nullable: true, default: true })
  is_required: boolean;

  @Column({ nullable: true, default: false })
  can_skip: boolean;

  @Column({ nullable: true, type: 'int' })
  min_approvers: number;

  @Column({ nullable: true, type: 'int' })
  max_approvers: number;

  @Column({ nullable: true, type: 'int', default: 1 })
  required_approvers: number;

  @Column({ nullable: true, default: 0 })
  order: number;
}

