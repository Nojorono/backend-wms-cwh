import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { AssignedGate } from "./assigned-gate.entity";

@Entity('assigned_gate_helper')
export class AssignedGateHelper extends BaseEntity {
@Column({ nullable: true })
  assigned_gate_id: string;

  @ManyToOne(() => AssignedGate, (assignedGate) => assignedGate.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assigned_gate_id' })
  assigned_gate: AssignedGate;

  @Column({ nullable: true })
  helper_name: string;

  @Column({ nullable: true })
  helper_phone: string;
}