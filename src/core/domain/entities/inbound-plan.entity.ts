import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { MasterSupplier } from './master-supplier.entity';
import { MasterWarehouse } from './master-warehouse.entity';
import { InboundPlanItem } from './inbound-plan-item.entity';

export enum PlanStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  COMPLETED = 'COMPLETED'
}

@Entity('inbound_plan')
export class InboundPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', nullable: true })
  organization_id: number;

  @Column({ name: 'inbound_planning_no', nullable: true })
  inbound_planning_no: string;

  @Column({ name: 'delivery_no', nullable: true })
  delivery_no: string;

  @Column({ name: 'po_no', nullable: true })
  po_no: string;

  @Column({ name: 'client_name', nullable: true })
  client_name: string;

  @Column({ name: 'order_type', nullable: true })
  order_type: string;

  @Column({ name: 'task_type', nullable: true })
  task_type: string;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => MasterSupplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: MasterSupplier;

  @ManyToOne(() => MasterWarehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: MasterWarehouse;

  @OneToMany(() => InboundPlanItem, (item) => item.inbound_plan)
  items: InboundPlanItem[];

  @Column({ name: 'plan_delivery_date', nullable: true })
  plan_delivery_date: Date;

  @Column({ nullable: true })
  plan_status: PlanStatus;

  @Column({ nullable: true })
  plan_type: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 