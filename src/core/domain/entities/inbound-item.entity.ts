import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Inbound } from './inbound.entity';
import { InboundDo } from './inbound-do.entity';
import { MasterItem } from './master-item.entity';
import { MasterWarehouse } from './master-warehouse.entity';
export enum InspectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

@Entity('inbound_item')
export class InboundItem extends BaseEntity {
  @Column({ nullable: true })
  inbound_id: string;

  @ManyToOne(() => Inbound, (inbound) => inbound.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound;

  @Column({ nullable: true })
  inbound_do_id: string;

  @ManyToOne(() => InboundDo, (inboundDo) => inboundDo.inbound_items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_do_id' })
  inbound_do: InboundDo;

  @Column({ nullable: true })
  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantity_inspection: number;

  @Column({ type: 'int', nullable: true })
  quantity_difference: number;

  @Column({ nullable: true })
  sub_inventory_difference: string;

  @ManyToOne(() => MasterWarehouse, (warehouse) => warehouse.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sub_inventory_difference' })
  warehouse: MasterWarehouse;

  @Column({ nullable: true, default: InspectionStatus.PENDING })
  inspection_status: InspectionStatus;

  @Column({ nullable: true })
  classification_id: string;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true })
  line_number: number;
}
