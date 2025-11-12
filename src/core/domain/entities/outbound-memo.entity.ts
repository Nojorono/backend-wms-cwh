import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemoItem } from './outbound-memo-item.entity';
import { AssignedPicking } from './assigned-picking.entity';
import { PickingTransaction } from './transaction-picking.entity';

export enum OutboundMemoStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
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

  @Column({ nullable: true, default: false })
  has_do: boolean;

  @OneToMany(() => OutboundMemoItem, (outboundMemoItem) => outboundMemoItem.outbound_memo)
  outbound_memo_items: OutboundMemoItem[];

  @OneToMany(() => PickingTransaction, (transactionPicking) => transactionPicking.memo)
  transaction_pickings: PickingTransaction[];

  @OneToMany(() => AssignedPicking, (assignedPicking) => assignedPicking.memo)
  assigned_pickings: AssignedPicking[];
}
