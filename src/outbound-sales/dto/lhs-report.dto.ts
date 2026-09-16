import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { onHandAtrDateNowExample } from './inv-on-hand-qty-with-atr.dto';

export class LhsReportQueryDto {
  @ApiProperty({
    description: 'Report date H (YYYY-MM-DD, WIB). Stock Awal uses H-1; Stock Meta / DO / BTB use H.',
    example: onHandAtrDateNowExample(),
  })
  @IsDateString()
  @IsNotEmpty()
  date: string; //  updated_at for dosugestion spb
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

  @ApiProperty({ example: '2026-06-19' })
  date: string;

  @ApiProperty({ example: '2026-06-18', description: 'Date used for stock_awal (H-1)' })
  previous_date: string;

  @ApiProperty({ type: [LHSReportItemDto] })
  items: LHSReportItemDto[];
}
