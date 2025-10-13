import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemo } from './outbound-memo.entity';

@Entity('assigned_picking')
export class AssignedPicking extends BaseEntity {
  @Column({ nullable: true })
  memo_id: string;

  @ManyToOne(() => OutboundMemo, (memo) => memo.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memo_id' })
  memo: OutboundMemo;

  @Column({ nullable: true })
  picking_user_id: string;

  @Column({ nullable: true })
  picking_name: string;

  @Column({ nullable: true })
  picking_phone: string;
}
