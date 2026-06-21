import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterIO } from './master-io.entity';

@Entity('on_hand_atr')
export class OnHandAtr extends BaseEntity {
  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ name: 'item_code', type: 'varchar', nullable: true })
  item_code: string;

  @Column({ name: 'item_number', type: 'varchar', nullable: true })
  item_number: string;

  @Column({ name: 'item_description', type: 'varchar', nullable: true })
  item_description: string;

  @Column({ name: 'inventory_item_id', type: 'bigint', nullable: true })
  inventory_item_id: number;

  /** Oracle inventory org id (numeric), distinct from WMS organization_id FK. */
  @Column({ name: 'oracle_organization_id', type: 'int', nullable: true })
  oracle_organization_id: number;

  @Column({ name: 'organization_code', type: 'varchar', nullable: true })
  organization_code: string;

  @Column({ name: 'organization_name', type: 'varchar', nullable: true })
  organization_name: string;

  @Column({ name: 'subinventory_code', type: 'varchar', nullable: true })
  subinventory_code: string;

  @Column({ name: 'locator_id', type: 'int', nullable: true })
  locator_id: number;

  @Column({ name: 'locator', type: 'varchar', nullable: true })
  locator: string;

  @Column({ name: 'locator_name', type: 'varchar', nullable: true })
  locator_name: string;

  @Column({ name: 'quantity', type: 'int', nullable: true })
  quantity: number;

  @Column({ name: 'avail_to_reserve', type: 'int', nullable: true })
  avail_to_reserve: number;

  @Column({ name: 'total_submitted', type: 'int', nullable: true })
  total_submitted: number;

  @Column({ name: 'created_by', type: 'varchar', nullable: true })
  created_by: string;

  @Column({ name: 'updated_by', type: 'varchar', nullable: true })
  updated_by: string;
}
