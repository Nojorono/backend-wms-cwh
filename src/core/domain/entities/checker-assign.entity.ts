import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { InboundPlan } from './inbound-plan.entity';

@Entity('checker_assign')
export class CheckerAssign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inbound_plan_id', nullable: true })
  inbound_plan_id: string;

  @ManyToOne(() => InboundPlan)
  @JoinColumn({ name: 'inbound_plan_id' })
  inbound_plan: InboundPlan;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'checker_leader_id' })
  checker_leader: User;

  @ManyToMany(() => User, (user) => user.id)
  @JoinTable({ name: 'checker_assign_user', joinColumn: { name: 'checker_assign_id', referencedColumnName: 'id' }, inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' } })
  checkers: User[];

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  assign_date_start: Date;

  @Column({ nullable: true })
  assign_date_finish: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}