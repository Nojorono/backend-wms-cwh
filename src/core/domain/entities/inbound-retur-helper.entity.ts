import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InboundRetur } from './inbound-retur.entity';

@Entity('inbound_retur_helper')
export class InboundReturHelper extends BaseEntity {
  @Column({ nullable: true })
  inbound_retur_id: string;

  @ManyToOne(() => InboundRetur, (inboundRetur) => inboundRetur.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_retur_id' })
  inbound_retur: InboundRetur;

  @Column({ nullable: true })
  helper_user_id: string;

  @Column({ nullable: true })
  helper_name: string;

  @Column({ nullable: true })
  helper_phone: string;
}
