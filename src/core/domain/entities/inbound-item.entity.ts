import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('inbound_item')
export class InboundItem extends BaseEntity {
  @Column({ nullable: true })
  inbound_id: string;

  @Column({ nullable: true })
  inbound_do_id: string;

  @Column({ nullable: true })
  item_id: string;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  classification_id: string;

  @Column({ nullable: true })
  uom: string;
}
