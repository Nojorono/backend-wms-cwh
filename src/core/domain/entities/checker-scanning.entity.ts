import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToOne } from 'typeorm';
import { InboundPlanItem } from './inbound-plan-item.entity';
import { User } from './user.entity';

@Entity('checker_scanning')
export class CheckerScanning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inbound_transporter_id', nullable: true })
  inbound_transporter_id: string;

  @Column({ name: 'organization_id', nullable: true })
  organization_id: number;

  @Column({ name: 'inbound_plan_id', nullable: true })
  inbound_plan_id: string;

  @Column({ name: 'inbound_delivery_order_id', nullable: true })
  inbound_delivery_order_id: string;

  @ManyToOne(() => InboundPlanItem)
  @JoinColumn({ name: 'inbound_plan_item_id' })
  inbound_plan_item: InboundPlanItem;

  @Column({ name: 'checker_assign_id', nullable: true })
  checker_assign_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'checker_id' })
  checker: User;

  @Column({ name: 'actual_qty', nullable: true })
  actual_qty: number;

  @Column({ name: 'pallet_code', nullable: true })
  pallet_code: string;

  @Column({ name: 'updated_by', nullable: true })
  updated_by: string;

  @Column({ name: 'created_by', nullable: true })
  created_by: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}