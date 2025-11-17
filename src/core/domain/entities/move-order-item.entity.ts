
import { Entity, Column, ManyToOne } from 'typeorm';
import { JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterItem } from './master-item.entity';
import { MasterPallet } from './master-pallet.entity';
import { MoveOrder } from './move-order.entity';

@Entity('move_order_item')
export class MoveOrderItem extends BaseEntity {
  @Column({ nullable: true })
  move_order_id: string;

  @ManyToOne(() => MoveOrder, (moveOrder) => moveOrder.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'move_order_id' })
  move_order: MoveOrder;

  @Column({ nullable: true })
  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id)
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true })
  production_date: Date;

  @Column({ nullable: true })
  week_number: number;

  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id)
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  uom: string;
}
