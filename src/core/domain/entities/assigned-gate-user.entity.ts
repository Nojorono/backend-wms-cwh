import { User } from "./user.entity";
import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { AssignedGate } from "./assigned-gate.entity";

@Entity('assigned_gate_user')
export class AssignedGateUser extends BaseEntity {
@Column({ nullable: true })
  assigned_gate_id: string;

  @ManyToOne(() => AssignedGate, (assignedGate) => assignedGate.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assigned_gate_id' })
  assigned_gate: AssignedGate;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  user_name: string;

  @Column({ nullable: true })
  user_phone: string;
}