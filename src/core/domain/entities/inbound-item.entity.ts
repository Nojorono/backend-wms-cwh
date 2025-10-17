import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Inbound } from './inbound.entity';
import { InboundDo } from './inbound-do.entity';

export enum InspectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

@Entity('inbound_item')
export class InboundItem extends BaseEntity {
  @Column({ nullable: true })
  inbound_id: string;

  @ManyToOne(() => Inbound, (inbound) => inbound.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound;

  @Column({ nullable: true })
  inbound_do_id: string;

  @ManyToOne(() => InboundDo, (inboundDo) => inboundDo.inbound_items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_do_id' })
  inbound_do: InboundDo;

  @Column({ nullable: true })
  item_id: string;

  @Column({ nullable: true })
  quantity: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity_inspection: number;

  @Column({ nullable: true, default: InspectionStatus.PENDING })
  inspection_status: InspectionStatus;

  @Column({ nullable: true })
  classification_id: string;

  @Column({ nullable: true })
  uom: string;
}
