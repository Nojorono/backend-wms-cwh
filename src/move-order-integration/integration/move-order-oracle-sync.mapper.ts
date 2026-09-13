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
  TRANSACTION_TEMP_ID: 'transaction_temp_id',
  REQUEST_ID: 'request_id',
};

export function normalizeOracleRecord(
  source?: Record<string, unknown>,
): Record<string, unknown> {
  if (!source) {
    return {};
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source)) {
    normalized[key.toUpperCase()] = value;
  }
  return normalized;
}

import { NormalizedMoveOrderFindData } from './move-order-find.types';

function extractOracleLines(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (row): row is Record<string, unknown> => typeof row === 'object' && row != null,
  );
}

/** Oracle find returns flat header row with LINES[], or { header, lines }. */
export function normalizeMoveOrderFindData(
  data?: Record<string, unknown> | null,
): NormalizedMoveOrderFindData | null {
  if (!data) {
    return null;
  }

  const nestedHeader = data.header;
  if (typeof nestedHeader === 'object' && nestedHeader != null) {
    const header = normalizeOracleRecord(nestedHeader as Record<string, unknown>);
    const lines = extractOracleLines(
      data.lines ?? data.LINES ?? header.LINES,
    );
    const { LINES: _lines, ...headerWithoutLines } = header;
    return { header: headerWithoutLines, lines };
  }

  const normalized = normalizeOracleRecord(data);
  const { LINES, ...headerFields } = normalized;
  return {
    header: headerFields,
    lines: extractOracleLines(LINES),
  };
}

const DATE_WMS_FIELDS = new Set([
  'date_required',
  'status_date',
  'program_update_date',
  'creation_date',
  'last_update_date',
  'pick_slip_date',
]);

const NUMERIC_WMS_FIELDS = new Set([
  'header_iface_id',
  'transaction_type_id',
  'move_order_type',
  'organization_id',
  'to_account_id',
  'grouping_rule_id',
  'ship_to_location_id',
  'reference_id',
  'header_status',
  'program_application_id',
  'program_id',
  'header_id',
  'request_id',
  'total_lines',
  'created_by',
  'last_update_login',
  'last_updated_by',
  'line_iface_id',
  'line_number',
  'inventory_item_id',
  'from_subinventory_id',
  'from_locator_id',
  'to_organization_id',
  'to_subinventory_id',
  'to_locator_id',
  'to_account_id',
  'quantity',
  'quantity_delivered',
  'quantity_detailed',
  'reason_id',
  'project_id',
  'task_id',
  'transaction_header_id',
  'txn_source_id',
  'txn_source_line_id',
  'txn_source_line_detail_id',
  'transaction_source_type_id',
  'primary_quantity',
  'line_status',
  'line_id',
  'transaction_temp_id',
]);

function coerceWmsValue(wmsKey: string, value: unknown): unknown {
  if (value == null) {
    return value;
  }

  if (DATE_WMS_FIELDS.has(wmsKey)) {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? value : parsed;
    }
  }

  if (NUMERIC_WMS_FIELDS.has(wmsKey)) {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
  }

  if (typeof value === 'string') {
    return value;
  }

  return value;
}

function mapOracleRecord<T extends object>(
  source: Record<string, unknown> | undefined,
  fieldMap: Record<string, keyof T>,
): Partial<T> {
  if (!source) {
    return {};
  }

  const normalized = normalizeOracleRecord(source);
  const result: Partial<T> = {};
  for (const [oracleKey, wmsKey] of Object.entries(fieldMap)) {
    if (normalized[oracleKey] !== undefined && normalized[oracleKey] !== null) {
      const coerced = coerceWmsValue(String(wmsKey), normalized[oracleKey]);
      result[wmsKey as keyof T] = coerced as T[keyof T];
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
  const normalized = normalizeOracleRecord(header);
  const raw = normalized.IFACE_STATUS;
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
