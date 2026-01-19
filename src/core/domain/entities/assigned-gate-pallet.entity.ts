import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AssignedGate } from './assigned-gate.entity';
import { MasterPallet } from './master-pallet.entity';

export enum AssignedGatePalletStatus {
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

@Entity('assigned_gate_pallet')
export class AssignedGatePallet extends BaseEntity {
  @Column({ nullable: true })
  assigned_gate_id: string;

  @ManyToOne(() => AssignedGate, (assignedGate) => assignedGate.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assigned_gate_id' })
  assigned_gate: AssignedGate;

  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({
    type: 'enum',
    enum: AssignedGatePalletStatus,
    default: AssignedGatePalletStatus.ASSIGNED,
    nullable: true,
  })
  status: AssignedGatePalletStatus;
}