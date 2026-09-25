import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { onHandAtrDateNowExample } from './inv-on-hand-qty-with-atr.dto';

export class LhsReportQueryDto {
  @ApiProperty({
    description:
      'Report date H (YYYY-MM-DD, WIB). Stock Awal uses H-1; Stock Meta / BTB use H. ' +
      'DO/SPB rows filter by do_suggestion.updated_at on H.',
    example: onHandAtrDateNowExample(),
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}

export class LHSReportItemDto {
  @ApiProperty({ example: 'ABC12' })
  item_code: string;

  @ApiProperty({ example: 'Item description', required: false })
  item_description?: string;

  @ApiProperty({
    example: 100,
    description: 'Opening stock = on_hand_atr quantity sum for date H-1',
  })
  stock_awal: number;

  @ApiProperty({
    example: 15,
    description:
      'Incoming = abs(qty_final - qty_submitted) when negative, plus BTB qty on date H',
  })
  incoming: number;

  @ApiProperty({
    example: 10,
    description: 'Outgoing = qty_final - qty_submitted when positive, else 0',
  })
  outgoing: number;

  @ApiProperty({
    example: 105,
    description: 'End-of-day stock = on_hand_atr quantity sum for date H',
  })
  stock_meta: number;

  @ApiProperty({ example: 80, description: 'Sum of item_qty_final on date H' })
  qty_final: number;

  @ApiProperty({ example: 90, description: 'Sum of item_qty_submitted on date H' })
  qty_submitted: number;

  @ApiProperty({ example: 5, description: 'Sum of btb_qty on date H' })
  btb_qty: number;
}

export class LHSReportResponseDto {
  @ApiProperty({ example: 'uuid-organization-id' })
  organization_id: string;

  @ApiProperty({ example: 'Organization Name' })
  organization_name: string;

  @ApiProperty({ example: '2026-06-19' })
  date: string;

  @ApiProperty({ example: '2026-06-18', description: 'Date used for stock_awal (H-1)' })
  previous_date: string;

  @ApiProperty({ type: [LHSReportItemDto] })
  items: LHSReportItemDto[];
}

export class LHSReportDetailRowDto {
  @ApiProperty({
    example: 'Outgoing',
    description: 'Section: Stock Awal | Incoming | Outgoing | Stock Meta',
  })
  ket1: string;

  @ApiPropertyOptional({
    example: 'SPB Submitted',
    description: 'Sub-section e.g. SPB Submitted, BTB',
  })
  ket2?: string;

  @ApiPropertyOptional({ example: '07052300162DC' })
  sales_nik?: string;

  @ApiPropertyOptional({ example: 'ARDIAN SAPUTRA' })
  sales_name?: string;

  @ApiPropertyOptional({ example: 'SD', description: 'Channel / trip_type' })
  channel?: string;

  @ApiPropertyOptional({
    example: 'FINAL',
    description: 'DO suggestion status (Outgoing SPB rows)',
    enum: ['DRAFT', 'REVISED', 'SUBMITTED', 'FINAL', 'VOID', 'VOID_NEED_ACTION', 'COMPLETED'],
  })
  status?: string;

  @ApiPropertyOptional({
    example: '2026-06-19',
    description: 'Call plan start date (Outgoing SPB rows)',
  })
  callplan_start_date?: string;

  @ApiPropertyOptional({
    example: 'SMG/2026/6/000001.1',
    description: 'Call plan number (Outgoing SPB rows)',
  })
  callplan_number?: string;

  @ApiPropertyOptional({
    example: 'SPB/SMG/2026/6/000001.1/5001',
    description: 'SPB number (Outgoing SPB rows)',
  })
  spb_number?: string;

  @ApiProperty({
    example: { ABC12: 61, AMB16: 60 },
    description: 'Qty keyed by item_code (matrix columns)',
  })
  quantities: Record<string, number>;
}

export class LHSReportDetailResponseDto {
  @ApiProperty({ example: 'uuid-organization-id' })
  organization_id: string;

  @ApiProperty({ example: 'SMG' })
  organization_name: string;

  @ApiProperty({ example: '2026-06-19' })
  date: string;

  @ApiProperty({ example: '2026-06-18' })
  previous_date: string;

  @ApiProperty({
    example: ['ABC12', 'AMB16', 'AMJ16'],
    description: 'SKU column headers for the matrix',
  })
  item_codes: string[];

  @ApiProperty({ type: [LHSReportDetailRowDto] })
  rows: LHSReportDetailRowDto[];
}
