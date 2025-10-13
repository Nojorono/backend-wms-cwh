import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemoItem } from './outbound-memo-item.entity';

export enum OutboundMemoStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('outbound_memo')
export class OutboundMemo extends BaseEntity {
  @Column({ nullable: true })
  requestor: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  ship_to: string;

  @Column({ nullable: true })
  destination: string;

  @Column({ nullable: true })
  delivery_date: Date;

  @Column({ nullable: true })
  status: OutboundMemoStatus;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => OutboundMemoItem, (outboundMemoItem) => outboundMemoItem.outbound_memo)
  outbound_memo_items: OutboundMemoItem[];
}
