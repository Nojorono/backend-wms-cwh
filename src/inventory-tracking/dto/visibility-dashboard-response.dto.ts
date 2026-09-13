import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PalletDetailDto {
  @ApiProperty({ example: '1487e95c-1505-43b9-87a3-0cfa9f1dfdb7' })
  pallet_id: string;

  @ApiPropertyOptional({ example: 'PAL-001' })
  pallet_code?: string;

  @ApiProperty({ example: 'f5b905c7-33b8-479f-be96-7c7c4eb26d63' })
  warehouse_id: string;

  @ApiPropertyOptional({ example: 'Main Warehouse' })
  warehouse_name?: string;

  @ApiProperty({ example: 'baea7245-ff90-4cdb-9716-2424fa3636ba' })
  warehouse_sub_id: string;

  @ApiPropertyOptional({ example: 'Sub Warehouse A' })
  warehouse_sub_name?: string;

  @ApiPropertyOptional({ example: 'SUB-A' })
  warehouse_sub_code?: string;

  @ApiProperty({ example: '8cdd029f-264e-4b78-a107-11dc1231df75' })
  warehouse_bin_id: string;

  @ApiPropertyOptional({ example: 'Bin 01' })
  warehouse_bin_name?: string;

  @ApiPropertyOptional({ example: 'BIN-01' })
  warehouse_bin_code?: string;

  @ApiProperty({ example: 'PCS' })
  uom: string;

  @ApiProperty({ example: 100 })
  quantity: number;

  @ApiPropertyOptional({ example: 'READY', enum: ['READY', 'PENDING'] })
  status_inventory?: string;

  @ApiPropertyOptional({ example: 47 })
  week_number?: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  production_date?: Date;
}

export class BookingDetailDto {
  @ApiProperty({ example: '01d8b538-d2e1-4fa5-a092-192894bc7e53' })
  transaction_id: string;

  @ApiPropertyOptional({ example: '62ec267e-56a6-43d5-8072-7be8d791f86a' })
  do_id?: string;

  @ApiPropertyOptional({ example: 'DO-2025-001' })
  do_number?: string;

  @ApiPropertyOptional({ example: 'a7705b3e-0059-4a7b-a16f-b4aa83f2267e' })
  memo_id?: string;

  @ApiPropertyOptional({ example: 'MEMO-2025-001' })
  memo_number?: string;

  @ApiProperty({
    example: 20,
    description: 'Remaining unpicked booked qty (original - scanned)',
  })
  quantity: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Same as quantity — remaining booked after scans',
  })
  booked_quantity?: number;

  @ApiPropertyOptional({ example: 30, description: 'Original transaction_picking.quantity' })
  original_quantity?: number;

  @ApiPropertyOptional({ example: 10, description: 'Sum of transaction_scan_picking.quantity_picked' })
  scanned_quantity?: number;

  @ApiPropertyOptional({ example: true, description: 'True when at least one scan picking exists' })
  has_scan?: boolean;

  @ApiPropertyOptional({ example: 'PCS' })
  uom?: string;

  @ApiPropertyOptional({ example: 47 })
  week_number?: number;

  @ApiPropertyOptional({ example: 'baea7245-ff90-4cdb-9716-2424fa3636ba' })
  source_warehouse_sub_id?: string;

  @ApiPropertyOptional({ example: 'Sub Warehouse A' })
  source_warehouse_sub_name?: string;

  @ApiPropertyOptional({ example: 'SUB-A' })
  source_warehouse_sub_code?: string;

  @ApiPropertyOptional({ example: '25bf7e1d-be0a-408f-96d4-9b90fa02ff6b' })
  source_bin_id?: string;

  @ApiPropertyOptional({ example: 'Bin 01' })
  source_bin_name?: string;

  @ApiPropertyOptional({ example: 'BIN-01' })
  source_bin_code?: string;
}

export class VisibilityDashboardUomSummaryDto {
  @ApiProperty({ example: 'PCS' })
  uom: string;

  @ApiProperty({ example: 12, description: 'Number of item rows for this UOM' })
  item_count: number;

  @ApiProperty({ example: 50000, description: 'READY + PENDING stock for this UOM' })
  total_quantity: number;

  @ApiProperty({ example: 45000, description: 'READY stock only for this UOM' })
  total_ready_quantity: number;

  @ApiProperty({ example: 5000, description: 'PENDING stock only for this UOM' })
  total_pending_quantity: number;

  @ApiProperty({ example: 5000 })
  total_booked_quantity: number;

  @ApiProperty({ example: 40000, description: 'ready - booked for this UOM' })
  total_available_quantity: number;

  @ApiProperty({ example: 3 })
  items_with_pending_bookings: number;
}

export class VisibilityDashboardSummaryDto {
  @ApiProperty({ example: 150, description: 'Distinct items (across all UOMs)' })
  total_items: number;

  @ApiProperty({ example: 180, description: 'Item + UOM rows' })
  total_item_uom_rows: number;

  @ApiProperty({ example: 25 })
  items_with_pending_bookings: number;

  @ApiProperty({
    type: [VisibilityDashboardUomSummaryDto],
    description: 'Quantity totals separated by UOM (do not sum across UOMs)',
  })
  by_uom: VisibilityDashboardUomSummaryDto[];
}

export class VisibilityDashboardItemDto {
  @ApiProperty({ example: 'uuid-item-123' })
  item_id: string;

  @ApiProperty({ example: 'ITEM-001' })
  sku: string;

  @ApiPropertyOptional({ example: 'ITEM001' })
  item_number?: string;

  @ApiPropertyOptional({ example: 'Product Name' })
  item_name?: string;

  @ApiProperty({ example: 'PCS' })
  uom: string;

  @ApiProperty({ example: 1000, description: 'READY + PENDING stock' })
  total_quantity: number;

  @ApiProperty({ example: 800, description: 'READY stock only' })
  ready_quantity: number;

  @ApiProperty({ example: 200, description: 'PENDING stock only' })
  pending_quantity: number;

  @ApiProperty({ example: 10 })
  pallet_count: number;

  @ApiProperty({ example: 200 })
  booked_quantity: number;

  @ApiProperty({ example: 3 })
  booking_count: number;

  @ApiProperty({ example: 600, description: 'ready_quantity - booked_quantity' })
  available_quantity: number;

  @ApiPropertyOptional({ example: 1 })
  min_week_number?: number;

  @ApiPropertyOptional({ example: 5 })
  max_week_number?: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  earliest_production_date?: Date;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  latest_production_date?: Date;

  @ApiProperty({ type: [PalletDetailDto] })
  pallet_details: PalletDetailDto[];

  @ApiProperty({ type: [BookingDetailDto] })
  booking_details: BookingDetailDto[];

  @ApiProperty({ example: true })
  has_pending_booking: boolean;
}

export class VisibilityDashboardDataDto {
  @ApiProperty({ type: VisibilityDashboardSummaryDto })
  summary: VisibilityDashboardSummaryDto;

  @ApiProperty({ type: [VisibilityDashboardItemDto] })
  items: VisibilityDashboardItemDto[];
}

export class VisibilityDashboardResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Dashboard visibility data retrieved successfully' })
  message: string;

  @ApiProperty({ type: VisibilityDashboardDataDto })
  data: VisibilityDashboardDataDto;
}
