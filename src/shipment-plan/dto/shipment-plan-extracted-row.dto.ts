import { ApiProperty } from '@nestjs/swagger';

export class ShipmentPlanExtractedRowDto {
  @ApiProperty({ example: 'DCJ' })
  source: string;

  @ApiProperty({ example: 'AMO' })
  type: string;

  @ApiProperty({ example: 'JKT' })
  reg: string;

  @ApiProperty({ example: 'SRG' })
  code: string;

  @ApiProperty({ description: 'Name / AMO label from sheet', example: 'Serang' })
  amo: string;

  @ApiProperty({ description: 'Destination / SKU code from column header', example: 'MD10' })
  sku: string;

  @ApiProperty({ example: 'PC 2025' })
  metric: string;

  @ApiProperty({ example: 180 })
  quantity: number;
}
