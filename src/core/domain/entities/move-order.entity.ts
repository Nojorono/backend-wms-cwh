import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MoveOrderItem } from './move-order-item.entity';


export enum MoveOrderType {
  TRANSFER_SELISIH = 'TRANSFER_SELISIH',
  GOOD_TO_BAD = 'GOOD_TO_BAD',
}

export enum MoveOrderStatus {
  PENDING = 'PENDING',
  CREATED = 'CREATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

@Entity('move_order')
export class MoveOrder extends BaseEntity {
  @Column({ nullable: true })
  move_order_number: string;

  @Column({ nullable: true })
  move_order_type: MoveOrderType;

  @Column({ nullable: true, type: 'enum', enum: MoveOrderStatus, default: MoveOrderStatus.CREATED })
  move_order_status: MoveOrderStatus;

  @OneToMany(() => MoveOrderItem, (moveOrderItem) => moveOrderItem.move_order)
  move_order_items: MoveOrderItem[];
}
