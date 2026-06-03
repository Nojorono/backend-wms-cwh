import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemo } from './outbound-memo.entity';
import { OutboundDo } from './outbound-do.entity';
import { OutboundMemoItem } from './outbound-memo-item.entity';

export enum ShipConfirmInternalTransactionType {
  OUTBOUND_GS_MUTASI_SO_INTERNAL = 'Outbound GS Mutasi SO Internal',
  OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE = 'Outbound GS SO Subdist Pick Release',
  OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM = 'Outbound GS SO Subdist Ship Confirm',
}

/** Oracle delivery attribute category (expedition type). */
/** PG truncates identifiers to 63 chars; must match the enum type name stored in the database. */
export const OUTBOUND_DELIVERY_ATTRIBUTE_CATEGORY_ENUM_NAME =
  'outbound_integration_deliveries_delivery_attribute_category_enu';

export enum DeliveryAttributeCategory {
  EKSPEDISI_EKSTERNAL = 'Ekspedisi Eksternal',
  EKSPEDISI_INTERNAL = 'Ekspedisi Internal',
  EKSPEDISI_VENDOR = 'Ekspedisi Vendor',
}

@Entity('outbound_integration_deliveries')
export class OutboundIntegrationDeliveries extends BaseEntity {
  @Column({ nullable: true })
  organization_id: string;

  @Column({ nullable: true })
  outbound_do_id: string;

  @ManyToOne(() => OutboundDo, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'outbound_do_id' })
  outbound_do: OutboundDo;

  @Column({ nullable: true })
  outbound_memo_id: string;

  @ManyToOne(() => OutboundMemo, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'outbound_memo_id' })
  outbound_memo: OutboundMemo;

  @Column({ nullable: true })
  outbound_memo_item_id: string;

  @ManyToOne(() => OutboundMemoItem, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'outbound_memo_item_id' })
  outbound_memo_item: OutboundMemoItem;

  @Column({ name: 'iface_id', type: 'bigint', nullable: true })
  iface_id: number;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: ShipConfirmInternalTransactionType,
    nullable: true,
  })
  transaction_type: ShipConfirmInternalTransactionType;

  @Column({ name: 'source_system', type: 'varchar', length: 100, nullable: true })
  source_system: string;

  @Column({ name: 'batch_id', type: 'bigint', nullable: true })
  batch_id: number;

  @Column({ name: 'batch_name', type: 'varchar', length: 100, nullable: true })
  batch_name: string;

  @Column({ name: 'source_header_id', type: 'varchar', length: 100, nullable: true })
  source_header_id: string;

  @Column({ name: 'source_line_id', type: 'varchar', length: 100, nullable: true })
  source_line_id: string;

  @Column({ name: 'iso_header_id', type: 'bigint', nullable: true })
  iso_header_id: number;

  @Column({ name: 'iso_line_id', type: 'bigint', nullable: true })
  iso_line_id: number;

  @Column({ name: 'iso_inventory_item_id', type: 'bigint', nullable: true })
  iso_inventory_item_id: number;

  @Column({ name: 'iso_organization_id', type: 'bigint', nullable: true })
  iso_organization_id: number;

  @Column({ name: 'delivery_id', type: 'bigint', nullable: true })
  delivery_id: number;

  @Column({ name: 'delivery_name', type: 'varchar', length: 30, nullable: true })
  delivery_name: string;

  @Column({
    name: 'delivery_attribute_category',
    type: 'enum',
    enum: DeliveryAttributeCategory,
    enumName: OUTBOUND_DELIVERY_ATTRIBUTE_CATEGORY_ENUM_NAME,
    nullable: true,
  })
  delivery_attribute_category: DeliveryAttributeCategory;

  @Column({ name: 'delivery_attribute6', type: 'varchar', length: 150, nullable: true })
  delivery_attribute6: string;

  @Column({ name: 'delivery_attribute7', type: 'varchar', length: 150, nullable: true })
  delivery_attribute7: string;

  @Column({ name: 'delivery_attribute8', type: 'varchar', length: 150, nullable: true })
  delivery_attribute8: string;

  @Column({ name: 'delivery_attribute9', type: 'varchar', length: 150, nullable: true })
  delivery_attribute9: string;

  @Column({ name: 'delivery_attribute10', type: 'varchar', length: 150, nullable: true })
  delivery_attribute10: string;

  @Column({ name: 'delivery_attribute11', type: 'varchar', length: 150, nullable: true })
  delivery_attribute11: string;

  @Column({ name: 'delivery_attribute12', type: 'varchar', length: 150, nullable: true })
  delivery_attribute12: string;

  @Column({ name: 'delivery_attribute13', type: 'varchar', length: 150, nullable: true })
  delivery_attribute13: string;

  @Column({ name: 'delivery_attribute14', type: 'varchar', length: 150, nullable: true })
  delivery_attribute14: string;

  @Column({ name: 'delivery_attribute15', type: 'varchar', length: 150, nullable: true })
  delivery_attribute15: string;

  @Column({ name: 'shipped_quantity', type: 'bigint', nullable: true })
  shipped_quantity: number;

  @Column({ name: 'create_delivery_status', type: 'varchar', length: 30, nullable: true })
  create_delivery_status: string;

  @Column({ name: 'create_delivery_message', type: 'varchar', length: 240, nullable: true })
  create_delivery_message: string;

  @Column({ name: 'update_delivery_status', type: 'varchar', length: 30, nullable: true })
  update_delivery_status: string;

  @Column({ name: 'update_delivery_message', type: 'varchar', length: 240, nullable: true })
  update_delivery_message: string;

  @Column({ name: 'pick_release_request_id', type: 'bigint', nullable: true })
  pick_release_request_id: number;

  @Column({ name: 'pick_release_status', type: 'varchar', length: 30, nullable: true })
  pick_release_status: string;

  @Column({ name: 'pick_release_message', type: 'varchar', length: 240, nullable: true })
  pick_release_message: string;

  @Column({ name: 'ship_confirm_request_id', type: 'bigint', nullable: true })
  ship_confirm_request_id: number;

  @Column({ name: 'ship_confirm_status', type: 'varchar', length: 30, nullable: true })
  ship_confirm_status: string;

  @Column({ name: 'ship_confirm_message', type: 'varchar', length: 240, nullable: true })
  ship_confirm_message: string;

  @Column({ name: 'creation_date', type: 'timestamp', nullable: true })
  creation_date: Date;

  @Column({ name: 'last_updated_date', type: 'timestamp', nullable: true })
  last_updated_date: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  created_by: number;

  @Column({ name: 'last_updated_by', type: 'bigint', nullable: true })
  last_updated_by: number;
}
