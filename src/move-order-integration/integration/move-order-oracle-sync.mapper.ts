import { UpdateMoveOrderIntegrationDto } from '../dto/update-move-order-integration.dto';
import { UpdateMoveOrderIntegrationLineDto } from '../dto/update-move-order-integration-line.dto';

const HEADER_ORACLE_TO_WMS: Record<string, keyof UpdateMoveOrderIntegrationDto> = {
  HEADER_IFACE_ID: 'header_iface_id',
  REQUEST_NUMBER: 'request_number',
  TRANSACTION_TYPE_ID: 'transaction_type_id',
  MOVE_ORDER_TYPE: 'move_order_type',
  ORGANIZATION_ID: 'organization_id',
  DESCRIPTION: 'description',
  DATE_REQUIRED: 'date_required',
  FROM_SUBINVENTORY_CODE: 'from_subinventory_code',
  TO_SUBINVENTORY_CODE: 'to_subinventory_code',
  TO_ACCOUNT_ID: 'to_account_id',
  GROUPING_RULE_ID: 'grouping_rule_id',
  SHIP_TO_LOCATION_ID: 'ship_to_location_id',
  REFERENCE_ID: 'reference_id',
  HEADER_STATUS: 'header_status',
  STATUS_DATE: 'status_date',
  ATTRIBUTE_CATEGORY: 'attribute_category',
  ATTRIBUTE1: 'attribute1',
  ATTRIBUTE2: 'attribute2',
  ATTRIBUTE3: 'attribute3',
  ATTRIBUTE4: 'attribute4',
  ATTRIBUTE5: 'attribute5',
  ATTRIBUTE6: 'attribute6',
  ATTRIBUTE7: 'attribute7',
  ATTRIBUTE8: 'attribute8',
  ATTRIBUTE9: 'attribute9',
  ATTRIBUTE10: 'attribute10',
  ATTRIBUTE11: 'attribute11',
  ATTRIBUTE12: 'attribute12',
  ATTRIBUTE13: 'attribute13',
  ATTRIBUTE14: 'attribute14',
  ATTRIBUTE15: 'attribute15',
  PROGRAM_APPLICATION_ID: 'program_application_id',
  PROGRAM_ID: 'program_id',
  PROGRAM_UPDATE_DATE: 'program_update_date',
  OPERATION: 'operation',
  DB_FLAG: 'db_flag',
  HEADER_ID: 'header_id',
  REQUEST_ID: 'request_id',
  SOURCE_SYSTEM: 'source_system',
  SOURCE_HEADER_ID: 'source_header_id',
  SOURCE_LINE_ID: 'source_line_id',
  SOURCE_BATCH_ID: 'source_batch_id',
  IFACE_STATUS: 'iface_status',
  IFACE_MESSAGE: 'iface_message',
  IFACE_MODE: 'iface_mode',
  TOTAL_LINES: 'total_lines',
  CREATION_DATE: 'creation_date',
  CREATED_BY: 'created_by',
  LAST_UPDATE_LOGIN: 'last_update_login',
  LAST_UPDATE_DATE: 'last_update_date',
  LAST_UPDATED_BY: 'last_updated_by',
};

const LINE_ORACLE_TO_WMS: Record<string, keyof UpdateMoveOrderIntegrationLineDto> = {
  LINE_IFACE_ID: 'line_iface_id',
  HEADER_IFACE_ID: 'header_iface_id',
  LINE_NUMBER: 'line_number',
  ORGANIZATION_ID: 'organization_id',
  INVENTORY_ITEM_ID: 'inventory_item_id',
  REVISION: 'revision',
  FROM_SUBINVENTORY_ID: 'from_subinventory_id',
  FROM_SUBINVENTORY_CODE: 'from_subinventory_code',
  FROM_LOCATOR_ID: 'from_locator_id',
  TO_ORGANIZATION_ID: 'to_organization_id',
  TO_SUBINVENTORY_ID: 'to_subinventory_id',
  TO_SUBINVENTORY_CODE: 'to_subinventory_code',
  TO_LOCATOR_ID: 'to_locator_id',
  TO_ACCOUNT_ID: 'to_account_id',
  LOT_NUMBER: 'lot_number',
  SERIAL_NUMBER_START: 'serial_number_start',
  SERIAL_NUMBER_END: 'serial_number_end',
  UOM_CODE: 'uom_code',
  QUANTITY: 'quantity',
  QUANTITY_DELIVERED: 'quantity_delivered',
  QUANTITY_DETAILED: 'quantity_detailed',
  DATE_REQUIRED: 'date_required',
  REASON_ID: 'reason_id',
  REFERENCE_ID: 'reference_id',
  REFERENCE: 'reference',
  REFERENCE_TYPE_CODE: 'reference_type_code',
  PROJECT_ID: 'project_id',
  TASK_ID: 'task_id',
  TRANSACTION_HEADER_ID: 'transaction_header_id',
  TXN_SOURCE_ID: 'txn_source_id',
  TXN_SOURCE_LINE_ID: 'txn_source_line_id',
  TXN_SOURCE_LINE_DETAIL_ID: 'txn_source_line_detail_id',
  TRANSACTION_TYPE_ID: 'transaction_type_id',
  TRANSACTION_SOURCE_TYPE_ID: 'transaction_source_type_id',
  PRIMARY_QUANTITY: 'primary_quantity',
  LINE_STATUS: 'line_status',
  STATUS_DATE: 'status_date',
  SOURCE_SYSTEM: 'source_system',
  SOURCE_HEADER_ID: 'source_header_id',
  SOURCE_LINE_ID: 'source_line_id',
  SOURCE_BATCH_ID: 'source_batch_id',
  IFACE_STATUS: 'iface_status',
  IFACE_MESSAGE: 'iface_message',
  CREATION_DATE: 'creation_date',
  CREATED_BY: 'created_by',
  LAST_UPDATE_LOGIN: 'last_update_login',
  LAST_UPDATE_DATE: 'last_update_date',
  LAST_UPDATED_BY: 'last_updated_by',
  LINE_ID: 'line_id',
  HEADER_ID: 'header_id',
  REQUEST_ID: 'request_id',
};

function mapOracleRecord<T extends object>(
  source: Record<string, unknown> | undefined,
  fieldMap: Record<string, keyof T>,
): Partial<T> {
  if (!source) {
    return {};
  }

  const result: Partial<T> = {};
  for (const [oracleKey, wmsKey] of Object.entries(fieldMap)) {
    if (source[oracleKey] !== undefined && source[oracleKey] !== null) {
      result[wmsKey as keyof T] = source[oracleKey] as T[keyof T];
    }
  }
  return result;
}

export function mapOracleHeaderToWmsUpdate(
  header: Record<string, unknown> | undefined,
): UpdateMoveOrderIntegrationDto {
  return mapOracleRecord<UpdateMoveOrderIntegrationDto>(header, HEADER_ORACLE_TO_WMS);
}

export function mapOracleLineToWmsUpdate(
  line: Record<string, unknown> | undefined,
): UpdateMoveOrderIntegrationLineDto {
  return mapOracleRecord<UpdateMoveOrderIntegrationLineDto>(line, LINE_ORACLE_TO_WMS);
}

const PENDING_IFACE_STATUSES = new Set([
  'PENDING',
  'PROCESSING',
  'READY',
  'SUBMITTED',
  'IN_PROGRESS',
]);

const SUCCESS_IFACE_STATUSES = new Set(['SUCCESS', 'COMPLETE', 'PROCESSED', 'S', 'INTEGRATED']);

const ERROR_IFACE_STATUSES = new Set(['ERROR', 'FAILED', 'E', 'REJECTED']);

export function resolveOracleIfaceStatus(
  header?: Record<string, unknown>,
): 'PENDING' | 'SUCCESS' | 'ERROR' {
  const raw = header?.IFACE_STATUS ?? header?.iface_status;
  const status = typeof raw === 'string' ? raw.toUpperCase() : '';

  if (!status || PENDING_IFACE_STATUSES.has(status)) {
    return 'PENDING';
  }
  if (ERROR_IFACE_STATUSES.has(status)) {
    return 'ERROR';
  }
  if (SUCCESS_IFACE_STATUSES.has(status)) {
    return 'SUCCESS';
  }
  return 'PENDING';
}
