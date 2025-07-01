import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToOne } from 'typeorm';
import { InboundPlanItem } from './inbound-plan-item.entity';
import { User } from './user.entity';

@Entity('checker_scanning')
export class CheckerScanning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InboundPlanItem)
  @JoinColumn({ name: 'inbound_plan_item_id' })
  inbound_plan_item: InboundPlanItem;

  @Column({ name: 'checker_assign_id', nullable: true })
  checker_assign_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'checker_id' })
  checker: User;

  @Column({ name: 'actual_qty', type: 'decimal', precision: 10, scale: 2 })
  actual_qty: number;

  @Column({ name: 'pallet_code', nullable: true })
  pallet_code: string;

  @Column({ name: 'scanning_date', nullable: true })
  scanning_date: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}