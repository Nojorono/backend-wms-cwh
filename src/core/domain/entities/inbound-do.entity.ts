import { Entity, Column, OneToMany } from 'typeorm';
import { InboundItem } from './inbound-item.entity';
import { BaseEntity } from './base.entity';

@Entity('inbound_do')
export class InboundDo extends BaseEntity {
  @Column({ nullable: true })
  inbound_id: string;

  @Column({ nullable: true })
  inbound_do_number: string;

  @Column({ nullable: true })
  inbound_do_date: Date;

  @Column({ nullable: true })
  attachment: string;

  @Column({ nullable: true })
  inbound_po_number: string;

  @Column({ nullable: true })
  inbound_po_date: Date;

  @Column({ default: false })
  flag_validated: boolean;

  @OneToMany(() => InboundItem, (inboundItem) => inboundItem.inbound_do_id)
  inbound_items: InboundItem[];
}
