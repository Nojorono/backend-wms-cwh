import { ApiProperty } from '@nestjs/swagger';
import { ShipmentPlanExtractedRowDto } from './shipment-plan-extracted-row.dto';

export class ShipmentPlanUploadResponseDto {
  @ApiProperty({ description: 'Created shipment plan id', format: 'uuid' })
  shipmentPlanId: string;

  @ApiProperty({ example: 'Template DSP WMS.xlsx' })
  fileName: string;

  @ApiProperty({ example: 108992 })
  size: number;

  @ApiProperty({ example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  mimeType: string;

  @ApiProperty({ description: 'Week number from master week (m_week.MINGGU)', example: 14 })
  weekNumber: number;

  @ApiProperty({ description: 'Batch number: YYYY-WW-increment', example: '2026-14-0001' })
  batchNumber: string;

  @ApiProperty({ example: 1296 })
  totalExtractedRows: number;

  @ApiProperty({ type: [ShipmentPlanExtractedRowDto] })
  rows: ShipmentPlanExtractedRowDto[];
}
