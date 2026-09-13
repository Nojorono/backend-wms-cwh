import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PoLineQueryDto {
  @ApiProperty({
    description: 'Vendor ID to filter by',
    example: 1001,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  vendor_id: number;

  @ApiPropertyOptional({
    description: 'PO Segment 1 (PO Number) to filter by',
    example: 'PO-2024-001',
  })
  @IsOptional()
  @IsString()
  segment1?: string;

  @ApiPropertyOptional({
    description: 'Item description to filter by',
    example: 'Laptop',
  })
  @IsOptional()
  @IsString()
  item_description?: string;

  @ApiPropertyOptional({
    description: 'PO Line ID to filter by',
    example: 12345,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  po_line_id?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
