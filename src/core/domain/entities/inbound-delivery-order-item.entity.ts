import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { InboundDeliveryOrder } from './inbound-delivery-order.entity';

@Entity('inbound_delivery_order_item')
export class InboundDeliveryOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InboundDeliveryOrder, order => order.items)
  @JoinColumn({ name: 'inbound_delivery_order_id' })
  inboundDeliveryOrder: InboundDeliveryOrder;

  @Column({ name: 'item_id', nullable: true })
  item_id: string;

  @Column({ name: 'qty_plan', nullable: true })
  qty_plan: number;

  @Column({ name: 'uom', nullable: true })
  uom: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}