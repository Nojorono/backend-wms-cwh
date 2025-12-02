import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundDo } from './outbound-do.entity';
import { AssignedGateUser } from './assigned-gate-user.entity';
import { AssignedGatePallet } from './assigned-gate-pallet.entity';

export enum AssignedGateStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
}

@Entity('assigned_gate')
export class AssignedGate extends BaseEntity {
  @Column({ nullable: true })
  gate_name: string;

  @Column({ nullable: true })
  outbound_do_id: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: AssignedGateStatus,
    default: AssignedGateStatus.PENDING,
  })
  status: AssignedGateStatus;

  @ManyToOne(() => OutboundDo, (outboundDo) => outboundDo.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outbound_do_id' })
  outbound_do: OutboundDo;

  @OneToMany(() => AssignedGateUser, (assignedGateUser) => assignedGateUser.assigned_gate)
  assigned_gate_users: AssignedGateUser[];

  @OneToMany(() => AssignedGatePallet, (assignedGatePallet) => assignedGatePallet.assigned_gate)
  assigned_gate_pallets: AssignedGatePallet[];
}
