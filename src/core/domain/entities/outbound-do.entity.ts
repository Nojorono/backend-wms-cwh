import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemo } from './outbound-memo.entity';

export enum OutboundDoStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  APPROVED_LOADED = 'APPROVED_LOADED',
}

export enum OutboundDoType {
  SUBDIST = 'SUBDIST',
  AMO = 'AMO',
}

@Entity('outbound_do')
export class OutboundDo extends BaseEntity {
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
