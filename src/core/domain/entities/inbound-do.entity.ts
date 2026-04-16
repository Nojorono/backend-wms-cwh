import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { InboundItem } from './inbound-item.entity';
import { BaseEntity } from './base.entity';
import { Inbound } from './inbound.entity';

export enum IntegrationStatus {
  PENDING = 'PENDING',
  READY = 'READY',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('inbound_do')
export class InboundDo extends BaseEntity {
  @Column({ nullable: true })
  inbound_id: string;

  @ManyToOne(() => Inbound, (inbound) => inbound.inbound_dos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound;

  @Column({ nullable: true })
  principal: string;

  @Column({ nullable: true })
  inbound_do_number: string;

  @Column({ nullable: true })
  inbound_do_date: Date;

  @Column({ nullable: true })
  attachment: string;

  @Column({ nullable: true })
  inbound_po_number: string;

  @Column({ nullable: true })
  vendor_id: number;

  @Column({ nullable: true })
  vendor_site_id: number;

  @Column({ nullable: true })
  total_line_items: number;

  @Column({ nullable: true })
  inbound_po_date: Date;

  @Column({ default: false })
  flag_validated: boolean;

  @Column({ default: false })
  validation_surat_jalan: boolean;

  @OneToMany(() => InboundItem, (inboundItem) => inboundItem.inbound_do)
  inbound_items: InboundItem[];

  @Column({ nullable: true, default: null })
  integration_status: IntegrationStatus;
}
