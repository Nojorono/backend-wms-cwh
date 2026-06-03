import { Entity, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemoItem } from './outbound-memo-item.entity';
import { AssignedPicking } from './assigned-picking.entity';
import { PickingTransaction } from './transaction-picking.entity';
import { MasterIO } from './master-io.entity';

export enum OutboundMemoStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  INTEGRATED = 'INTEGRATED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export enum OutboundMemoType {
  SUBDIST = 'SUBDIST',
  AMO = 'AMO',
}

@Entity('outbound_memo')
export class OutboundMemo extends BaseEntity {
  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ nullable: true, unique: true })
  outbound_memo_number: string;

  @Column({ nullable: true })
  requestor: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  ship_to: string;

  @Column({ nullable: true })
  destination: string;

  @Column({ nullable: true })
  destination_io_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'destination_io_id' })
  destination_io: MasterIO;

  @Column({ nullable: true })
  delivery_date: Date;

  @Column({ nullable: true })
  status: OutboundMemoStatus;

  @Column({ nullable: true })
  type: OutboundMemoType;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true, default: false })
  has_do: boolean;

  @Column({ nullable: true })
  so_number: string;

  @Column({ nullable: true })
  so_organization_id: string;

  @Column({ nullable: true })
  header_id: number;

  @OneToMany(() => OutboundMemoItem, (outboundMemoItem) => outboundMemoItem.outbound_memo)
  outbound_memo_items: OutboundMemoItem[];

  @OneToMany(() => PickingTransaction, (transactionPicking) => transactionPicking.memo)
  transaction_pickings: PickingTransaction[];

  @OneToMany(() => AssignedPicking, (assignedPicking) => assignedPicking.memo)
  assigned_pickings: AssignedPicking[];
}
