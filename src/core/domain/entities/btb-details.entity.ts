import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Btb } from './btb.entity';

@Entity('btb_details')
export class BtbDetails extends BaseEntity {
  @Column({ name: 'btb_uuid', type: 'uuid', nullable: true })
  btb_uuid: string;

  @ManyToOne(() => Btb, (btb) => btb.details, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'btb_uuid' })
  btb: Btb;

  @Column({ name: 'item_code', type: 'varchar', length: 100, nullable: true })
  item_code: string;

  @Column({ name: 'inventory_item_id', type: 'bigint', nullable: true })
  inventory_item_id: number;

  @Column({ name: 'item_name', type: 'varchar', length: 255, nullable: true })
  item_name: string;

  @Column({ name: 'item_number', type: 'varchar', length: 100, nullable: true })
  item_number: string;

  @Column({ name: 'type', type: 'varchar', length: 50, nullable: true, default: 'GS' })
  type: string;

  @Column({ name: 'year', type: 'int', nullable: true })
  year: number;

  @Column({ name: 'bandrol_price', type: 'int', nullable: true })
  bandrol_price: number;

  @Column({ name: 'bs_price', type: 'int', nullable: true })
  bs_price: number;

  @Column({ name: 'btb_qty', type: 'int', nullable: true })
  btb_qty: number;

  @Column({ name: 'btb_uom', type: 'varchar', length: 50, nullable: true })
  btb_uom: string;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  created_by: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updated_by: string;
}
