import { Entity, Column, ManyToMany, JoinTable, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemo } from './outbound-memo.entity';
import { MasterIO } from './master-io.entity';

export enum OutboundDoStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  APPROVED_LOAD = 'APPROVED_LOAD',
}

export enum OutboundDoType {
  SUBDIST = 'SUBDIST',
  AMO = 'AMO',
}

export enum OutboundDoTypeCalculation {
  MULTIDROP = 'MULTIDROP',
  SINGLEDROP = 'SINGLEDROP',
}

export enum OutboundDoDeliveryCategory {
  EKSPEDISI_EKSTERNAL = 'Ekspedisi Eksternal',
  EKSPEDISI_INTERNAL = 'Ekspedisi Internal',
  EKSPEDISI_VENDOR = 'Ekspedisi Vendor',
}

@Entity('outbound_do')
export class OutboundDo extends BaseEntity {
  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ nullable: true, unique: true })
  outbound_do_number: string;

  @Column({ nullable: true })
  expedition: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  license_plate: string;

  @Column({ nullable: true })
  container_number: string;

  @Column({ nullable: true })
  seal_number: string;

  @Column({ nullable: true })
  driver_name: string;

  @Column({ nullable: true })
  driver_phone: string;

  @Column({ nullable: true })
  vendor_id: string;

  @Column({ nullable: true })
  vendor_po_number: string;

  @Column({ nullable: true, type: 'bigint' })
  qty_utilitas: number;

  @Column({ nullable: true, type: 'enum', enum: OutboundDoTypeCalculation })
  type_calculation: OutboundDoTypeCalculation;

  @Column({ nullable: true, type: 'enum', enum: OutboundDoDeliveryCategory })
  delivery_category: OutboundDoDeliveryCategory;

  @Column({
    nullable: true,
    type: 'enum',
    enum: OutboundDoStatus,
    default: OutboundDoStatus.PENDING,
  })
  status: OutboundDoStatus;

  @Column({ nullable: true, type: 'enum', enum: OutboundDoType })
  outbound_type: OutboundDoType;

  @Column({ nullable: true })
  delivery_date: Date;

  @Column({ type: 'simple-array', nullable: true })
  memo_id: string[];

  @Column({ type: 'simple-array', nullable: true })
  memo_sequence: number[];

  @ManyToMany(() => OutboundMemo, { cascade: true })
  @JoinTable({
    name: 'outbound_do_memo',
    joinColumn: { name: 'outbound_do_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'outbound_memo_id', referencedColumnName: 'id' },
  })
  outbound_memos: OutboundMemo[];
}
