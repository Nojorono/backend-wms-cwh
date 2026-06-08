import { BaseEntity } from './base.entity';
import { Column, Entity } from 'typeorm';

@Entity('move_order_integration')
export class MoveOrderIntegration extends BaseEntity {
  @Column({ name: 'header_iface_id', type: 'bigint', nullable: true })
  header_iface_id: number;

  @Column({ name: 'request_number', type: 'bigint', nullable: true })
  request_number: number;

  @Column({ name: 'transaction_type_id', type: 'bigint', nullable: true })
  transaction_type_id: number;

  @Column({ name: 'move_order_type', type: 'bigint', nullable: true })
  move_order_type: number;

  @Column({ name: 'organization_id', type: 'bigint', nullable: true })
  organization_id: number;

  @Column({ name: 'description', type: 'varchar', length: 240, nullable: true })
  description: string;

  @Column({ name: 'date_required', type: 'timestamp', nullable: true })
  date_required: Date;

  @Column({ name: 'from_subinventory_code', type: 'varchar', length: 10, nullable: true })
  from_subinventory_code: string;

  @Column({ name: 'to_subinventory_code', type: 'varchar', length: 10, nullable: true })
  to_subinventory_code: string;

  @Column({ name: 'to_account_id', type: 'bigint', nullable: true })
  to_account_id: number;

  @Column({ name: 'grouping_rule_id', type: 'bigint', nullable: true })
  grouping_rule_id: number;

  @Column({ name: 'ship_to_location_id', type: 'bigint', nullable: true })
  ship_to_location_id: number;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  reference_id: number;

  @Column({ name: 'header_status', type: 'bigint', nullable: true })
  header_status: number;

  @Column({ name: 'status_date', type: 'timestamp', nullable: true })
  status_date: Date;

  @Column({ name: 'attribute_category', type: 'varchar', length: 30, nullable: true })
  attribute_category: string;

  @Column({ name: 'attribute1', type: 'varchar', length: 150, nullable: true })
  attribute1: string;
  @Column({ name: 'attribute2', type: 'varchar', length: 150, nullable: true })
  attribute2: string;
  @Column({ name: 'attribute3', type: 'varchar', length: 150, nullable: true })
  attribute3: string;
  @Column({ name: 'attribute4', type: 'varchar', length: 150, nullable: true })
  attribute4: string;
  @Column({ name: 'attribute5', type: 'varchar', length: 150, nullable: true })
  attribute5: string;
  @Column({ name: 'attribute6', type: 'varchar', length: 150, nullable: true })
  attribute6: string;
  @Column({ name: 'attribute7', type: 'varchar', length: 150, nullable: true })
  attribute7: string;
  @Column({ name: 'attribute8', type: 'varchar', length: 150, nullable: true })
  attribute8: string;
  @Column({ name: 'attribute9', type: 'varchar', length: 150, nullable: true })
  attribute9: string;
  @Column({ name: 'attribute10', type: 'varchar', length: 150, nullable: true })
  attribute10: string;
  @Column({ name: 'attribute11', type: 'varchar', length: 150, nullable: true })
  attribute11: string;
  @Column({ name: 'attribute12', type: 'varchar', length: 150, nullable: true })
  attribute12: string;
  @Column({ name: 'attribute13', type: 'varchar', length: 150, nullable: true })
  attribute13: string;
  @Column({ name: 'attribute14', type: 'varchar', length: 150, nullable: true })
  attribute14: string;
  @Column({ name: 'attribute15', type: 'varchar', length: 150, nullable: true })
  attribute15: string;

  @Column({ name: 'program_application_id', type: 'bigint', nullable: true })
  program_application_id: number;

  @Column({ name: 'program_id', type: 'bigint', nullable: true })
  program_id: number;

  @Column({ name: 'program_update_date', type: 'timestamp', nullable: true })
  program_update_date: Date;

  @Column({ name: 'operation', type: 'varchar', length: 30, nullable: true })
  operation: string;

  @Column({ name: 'db_flag', type: 'varchar', length: 1, nullable: true })
  db_flag: string;

  @Column({ name: 'header_id', type: 'bigint', nullable: true })
  header_id: number;

  @Column({ name: 'request_id', type: 'bigint', nullable: true })
  request_id: number;

  @Column({ name: 'source_system', type: 'varchar', length: 100, nullable: true })
  source_system: string;

  @Column({ name: 'source_header_id', type: 'varchar', length: 100, nullable: true })
  source_header_id: string;

  @Column({ name: 'source_line_id', type: 'varchar', length: 100, nullable: true })
  source_line_id: string;

  @Column({ name: 'source_batch_id', type: 'varchar', length: 100, nullable: true })
  source_batch_id: string;

  @Column({ name: 'iface_status', type: 'varchar', length: 10, nullable: true })
  iface_status: string;

  @Column({ name: 'iface_message', type: 'varchar', length: 2000, nullable: true })
  iface_message: string;

  @Column({ name: 'iface_mode', type: 'varchar', length: 30, nullable: true })
  iface_mode: string;

  @Column({ name: 'creation_date', type: 'timestamp', nullable: true })
  creation_date: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  created_by: number;

  @Column({ name: 'last_update_login', type: 'bigint', nullable: true })
  last_update_login: number;

  @Column({ name: 'last_update_date', type: 'timestamp', nullable: true })
  last_update_date: Date;

  @Column({ name: 'last_updated_by', type: 'bigint', nullable: true })
  last_updated_by: number;
}
