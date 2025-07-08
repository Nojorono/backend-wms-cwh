import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { InboundDeliveryOrderItem } from './inbound-delivery-order-item.entity';

@Entity('inbound_delivery_order')
export class InboundDeliveryOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inbound_plan_id', nullable: true })
  inbound_plan_id: string;

  @Column({ name: 'inbound_transporter_id', nullable: true })
  inbound_transporter_id: string;

  @Column({ name: 'number_delivery_order', nullable: false, unique: true }) 
  number_delivery_order: string;

  @OneToMany(() => InboundDeliveryOrderItem, (item) => item.inboundDeliveryOrder, { cascade: true })
  items: InboundDeliveryOrderItem[];

  @Column({ name: 'created_by', nullable: true })
  created_by: string;

  @Column({ name: 'updated_by', nullable: true })
  updated_by: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}