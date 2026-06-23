import { CreateMoveOrderIntegrationLineDto } from '../dto/create-move-order-integration-line.dto';
import { CreateMoveOrderIntegrationPayloadDto } from '../dto/create-move-order-integration-payload.dto';
import { MoveOrderIntegration } from '../../core/domain/entities/move-order-integration.entity';
import { MoveOrderLineIntegration } from '../../core/domain/entities/move-order-integration-lines.entity';
import { CreateMoveOrderLineForHeaderDto } from './dto/create-move-order-line-for-header.dto';
import { CreateMoveOrderWithLinesDto } from './dto/create-move-order-with-lines.dto';

function toDateString(value?: Date | string | null): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.split('T')[0];
  }
  return value.toISOString().split('T')[0];
}

export function mapMoveOrderIntegrationLineToOracle(
  line: CreateMoveOrderIntegrationLineDto,
): CreateMoveOrderLineForHeaderDto {
  return {
    LINE_NUMBER: line.line_number ?? 0,
    ORGANIZATION_ID: line.organization_id ?? 0,
    INVENTORY_ITEM_ID: line.inventory_item_id ?? 0,
    FROM_SUBINVENTORY_CODE: line.from_subinventory_code ?? '',
    TO_SUBINVENTORY_CODE: line.to_subinventory_code ?? '',
    UOM_CODE: line.uom_code ?? '',
    QUANTITY: line.quantity ?? 0,
    DATE_REQUIRED: toDateString(line.date_required) ?? '',
    TRANSACTION_TYPE_ID: line.transaction_type_id ?? 0,
    TRANSACTION_SOURCE_TYPE_ID: line.transaction_source_type_id ?? 0,
    LINE_STATUS: line.line_status ?? 0,
    STATUS_DATE: toDateString(line.status_date) ?? '',
    FROM_LOCATOR_ID: line.from_locator_id,
    TO_LOCATOR_ID: line.to_locator_id,
    LOT_NUMBER: line.lot_number,
    SOURCE_LINE_ID: line.source_line_id,
    IFACE_STATUS: line.iface_status,
    OPERATION: line.operation,
    DB_FLAG: line.db_flag,
  };
}

export function mapMoveOrderIntegrationEntityToOracle(
  header: MoveOrderIntegration,
  lines: MoveOrderLineIntegration[],
): CreateMoveOrderWithLinesDto {
  return mapMoveOrderIntegrationToOracle({
    ...header,
    lines: lines.map((line) => ({ ...line })),
  } as CreateMoveOrderIntegrationPayloadDto);
}

export function mapMoveOrderIntegrationToOracle(
  payload: CreateMoveOrderIntegrationPayloadDto,
): CreateMoveOrderWithLinesDto {
  const lines = (payload.lines ?? []).map(mapMoveOrderIntegrationLineToOracle);

  return {
    REQUEST_NUMBER: payload.request_number ?? '',
    TRANSACTION_TYPE_ID: payload.transaction_type_id ?? 0,
    MOVE_ORDER_TYPE: payload.move_order_type ?? 0,
    ORGANIZATION_ID: payload.organization_id ?? 0,
    DATE_REQUIRED: toDateString(payload.date_required) ?? '',
    FROM_SUBINVENTORY_CODE: payload.from_subinventory_code ?? '',
    TO_SUBINVENTORY_CODE: payload.to_subinventory_code ?? '',
    HEADER_STATUS: payload.header_status ?? 0,
    STATUS_DATE: toDateString(payload.status_date) ?? '',
    ATTRIBUTE_CATEGORY: payload.attribute_category,
    ATTRIBUTE7: payload.attribute7,
    ATTRIBUTE8: payload.attribute8,
    ATTRIBUTE9: payload.attribute9,
    ATTRIBUTE10: payload.attribute10,
    ATTRIBUTE11: payload.attribute11,
    ATTRIBUTE12: payload.attribute12,
    ATTRIBUTE13: payload.attribute13,
    ATTRIBUTE14: payload.attribute14,
    OPERATION: payload.operation,
    DB_FLAG: payload.db_flag,
    SOURCE_SYSTEM: payload.source_system,
    SOURCE_HEADER_ID: payload.source_header_id,
    SOURCE_LINE_ID: payload.source_line_id,
    SOURCE_BATCH_ID: payload.source_batch_id,
    IFACE_STATUS: payload.iface_status,
    IFACE_MODE: payload.iface_mode,
    TOTAL_LINES: payload.total_lines ?? lines.length,
    CREATION_DATE: toDateString(payload.creation_date),
    CREATED_BY: payload.created_by,
    LAST_UPDATE_DATE: toDateString(payload.last_update_date),
    LAST_UPDATED_BY: payload.last_updated_by,
    lines,
  };
}
