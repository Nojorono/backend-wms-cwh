import { BaseEntity } from './base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { MoveOrderIntegration } from './move-order-integration.entity';

@Entity('move_order_line_integration')
export class MoveOrderLineIntegration extends BaseEntity {
  @Column({ name: 'move_order_integration_id', type: 'uuid', nullable: true })
  move_order_integration_id: string;

  @ManyToOne(() => MoveOrderIntegration, (header) => header.lines, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'move_order_integration_id' })
  move_order_integration: MoveOrderIntegration;

  @Column({ name: 'line_iface_id', type: 'bigint', nullable: true })
  line_iface_id: number;
  @Column({ name: 'header_iface_id', type: 'bigint', nullable: true })
  header_iface_id: number;

  @Column({ name: 'line_number', type: 'bigint', nullable: true })
  line_number: number;

  @Column({ name: 'organization_id', type: 'bigint', nullable: true })
  organization_id: number;

  @Column({ name: 'inventory_item_id', type: 'bigint', nullable: true })
  inventory_item_id: number;

  @Column({ name: 'revision', type: 'varchar', length: 3, nullable: true })
  revision: string;

  @Column({ name: 'from_subinventory_id', type: 'bigint', nullable: true })
  from_subinventory_id: number;

  @Column({ name: 'from_subinventory_code', type: 'varchar', length: 10, nullable: true })
  from_subinventory_code: string;

  @Column({ name: 'from_locator_id', type: 'bigint', nullable: true })
  from_locator_id: number;

  @Column({ name: 'to_organization_id', type: 'bigint', nullable: true })
  to_organization_id: number;

  @Column({ name: 'to_subinventory_id', type: 'bigint', nullable: true })
  to_subinventory_id: number;

  @Column({ name: 'to_subinventory_code', type: 'varchar', length: 10, nullable: true })
  to_subinventory_code: string;

  @Column({ name: 'to_locator_id', type: 'bigint', nullable: true })
  to_locator_id: number;

  @Column({ name: 'to_account_id', type: 'bigint', nullable: true })
  to_account_id: number;

  @Column({ name: 'lot_number', type: 'varchar', length: 80, nullable: true })
  lot_number: string;

  @Column({ name: 'serial_number_start', type: 'varchar', length: 30, nullable: true })
  serial_number_start: string;

  @Column({ name: 'serial_number_end', type: 'varchar', length: 30, nullable: true })
  serial_number_end: string;

  @Column({ name: 'uom_code', type: 'varchar', length: 3, nullable: true })
  uom_code: string;

  @Column({ name: 'quantity', type: 'bigint', nullable: true })
  quantity: number;
  @Column({ name: 'quantity_delivered', type: 'bigint', nullable: true })
  quantity_delivered: number;
  @Column({ name: 'quantity_detailed', type: 'bigint', nullable: true })
  quantity_detailed: number;

  @Column({ name: 'date_required', type: 'timestamp', nullable: true })
  date_required: Date;

  @Column({ name: 'reason_id', type: 'bigint', nullable: true })
  reason_id: number;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  reference_id: number;

  @Column({ name: 'reference', type: 'varchar', length: 240, nullable: true })
  reference: string;

  @Column({ name: 'reference_type_code', type: 'bigint', nullable: true })
  reference_type_code: number;

  @Column({ name: 'project_id', type: 'bigint', nullable: true })
  project_id: number;

  @Column({ name: 'task_id', type: 'bigint', nullable: true })
  task_id: number;

  @Column({ name: 'transaction_header_id', type: 'bigint', nullable: true })
  transaction_header_id: number;

  @Column({ name: 'txn_source_id', type: 'bigint', nullable: true })
  txn_source_id: number;

  @Column({ name: 'txn_source_line_id', type: 'bigint', nullable: true })
  txn_source_line_id: number;

  @Column({ name: 'txn_source_line_detail_id', type: 'bigint', nullable: true })
  txn_source_line_detail_id: number;

  @Column({ name: 'transaction_type_id', type: 'bigint', nullable: true })
  transaction_type_id: number;

  @Column({ name: 'transaction_source_type_id', type: 'bigint', nullable: true })
  transaction_source_type_id: number;

  @Column({ name: 'primary_quantity', type: 'bigint', nullable: true })
  primary_quantity: number;

  @Column({ name: 'put_away_strategy_id', type: 'bigint', nullable: true })
  put_away_strategy_id: number;

  @Column({ name: 'pick_strategy_id', type: 'bigint', nullable: true })
  pick_strategy_id: number;

  @Column({ name: 'unit_number', type: 'varchar', length: 30, nullable: true })
  unit_number: string;

  @Column({ name: 'ship_to_location_id', type: 'bigint', nullable: true })
  ship_to_location_id: number;

  @Column({ name: 'from_cost_group_id', type: 'bigint', nullable: true })
  from_cost_group_id: number;

  @Column({ name: 'to_cost_group_id', type: 'bigint', nullable: true })
  to_cost_group_id: number;

  @Column({ name: 'lpn_id', type: 'bigint', nullable: true })
  lpn_id: number;

  @Column({ name: 'to_lpn_id', type: 'bigint', nullable: true })
  to_lpn_id: number;

  @Column({ name: 'pick_methodology_id', type: 'bigint', nullable: true })
  pick_methodology_id: number;

  @Column({ name: 'container_item_id', type: 'bigint', nullable: true })
  container_item_id: number;

  @Column({ name: 'carton_grouping_id', type: 'bigint', nullable: true })
  carton_grouping_id: number;

  @Column({ name: 'line_status', type: 'bigint', nullable: true })
  line_status: number;

  @Column({ name: 'status_date', type: 'timestamp', nullable: true })
  status_date: Date;

  @Column({ name: 'inspection_status', type: 'bigint', nullable: true })
  inspection_status: number;

  @Column({ name: 'wms_process_flag', type: 'bigint', nullable: true })
  wms_process_flag: number;

  @Column({ name: 'pick_slip_number', type: 'bigint', nullable: true })
  pick_slip_number: number;

  @Column({ name: 'pick_slip_date', type: 'timestamp', nullable: true })
  pick_slip_date: Date;

  @Column({ name: 'ship_set_id', type: 'bigint', nullable: true })
  ship_set_id: number;

  @Column({ name: 'ship_model_id', type: 'bigint', nullable: true })
  ship_model_id: number;

  @Column({ name: 'model_quantity', type: 'bigint', nullable: true })
  model_quantity: number;

  @Column({ name: 'required_quantity', type: 'bigint', nullable: true })
  required_quantity: number;

  @Column({ name: 'secondary_uom', type: 'varchar', length: 3, nullable: true })
  secondary_uom: string;

  @Column({ name: 'secondary_quantity', type: 'bigint', nullable: true })
  secondary_quantity: number;

  @Column({ name: 'secondary_quantity_detailed', type: 'bigint', nullable: true })
  secondary_quantity_detailed: number;

  @Column({ name: 'secondary_quantity_delivered', type: 'bigint', nullable: true })
  secondary_quantity_delivered: number;

  @Column({ name: 'secondary_required_quantity', type: 'bigint', nullable: true })
  secondary_required_quantity: number;

  @Column({ name: 'grade_code', type: 'varchar', length: 150, nullable: true })
  grade_code: string;

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

  @Column({ name: 'line_id', type: 'bigint', nullable: true })
  line_id: number;

  @Column({ name: 'header_id', type: 'bigint', nullable: true })
  header_id: number;

  @Column({ name: 'transaction_temp_id', type: 'bigint', nullable: true })
  transaction_temp_id: number;

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
