import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { UUID } from 'crypto';

export class BulkUpdateSaldoInspectionItemDto {
  @ApiProperty({ description: 'Inbound item ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Quantity Inspection' })
  @IsNumber()
  quantity_inspection: number;

  @ApiProperty({ description: 'Quantity Difference' })
  @IsOptional()
  @IsNumber()
  quantity_difference?: number;

  @ApiProperty({ description: 'Sub Inventory Difference', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID(4, { message: 'sub_inventory_difference must be a valid UUID' })
  sub_inventory_difference?: UUID;
}

export class BulkUpdateSaldoInspectionDto {
  @ApiProperty({ description: 'Inbound item ID' })
  @IsString()
  inbound_do_id: string;

  @ApiProperty({
    description: 'Array of inbound items to update',
    type: [BulkUpdateSaldoInspectionItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateSaldoInspectionItemDto)
  items: BulkUpdateSaldoInspectionItemDto[];
}
