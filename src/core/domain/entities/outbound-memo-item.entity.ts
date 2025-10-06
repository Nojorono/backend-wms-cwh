import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemo } from './outbound-memo.entity';
import { MasterItem } from './master-item.entity';

@Entity('outbound_memo_item')
export class OutboundMemoItem extends BaseEntity {
  @Column({ nullable: true })
  outbound_memo_id: string;

  @ManyToOne(() => OutboundMemo, (outboundMemo) => outboundMemo.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'outbound_memo_id' })
  outbound_memo: OutboundMemo;

  @Column({ nullable: true })
  item_id: string;
  
  @ManyToOne(() => MasterItem, (item) => item.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true })
  quantity_plan: number;

  @Column({ nullable: true })
  uom: string;
}
