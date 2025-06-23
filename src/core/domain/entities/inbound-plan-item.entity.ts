import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { InboundPlan } from './inbound-plan.entity';
import { MasterItem } from './master-item.entity';
import { MasterClassificationItem } from './master-classification-item.entity';

@Entity('inbound_plan_item')
export class InboundPlanItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InboundPlan, (inboundPlan) => inboundPlan.items)
  @JoinColumn({ name: 'inbound_plan_id' })
  inbound_plan: InboundPlan;

  @ManyToOne(() => MasterItem)
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ type: 'date', name: 'expired_date', nullable: true })
  expired_date: Date;

  @Column({ type: 'decimal', name: 'qty_plan', precision: 10, scale: 2, nullable: true })
  qty_plan: number;
  
  @Column({ nullable: true })
  uom: string;

  @ManyToOne(() => MasterClassificationItem)
  @JoinColumn({ name: 'classification_item_id' })
  classification_item: MasterClassificationItem;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}