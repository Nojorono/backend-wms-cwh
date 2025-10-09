import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProgressionStatus } from 'src/core/domain/entities/inventory-tracking.entity';

export class CreateInventoryTrackingDto {
  @ApiProperty({ example: 'pallet-uuid', required: false })
  @IsString()
  @IsOptional()
  pallet_id?: string;

  @ApiProperty({ example: 'warehouse-uuid', required: false })
  @IsString()
  @IsOptional()
  warehouse_id?: string;

  @ApiProperty({ example: 'warehouse-sub-uuid', required: false })
  @IsString()
  @IsOptional()
  warehouse_sub_id?: string;

  @ApiProperty({ example: 'warehouse-bin-uuid', required: false })
  @IsString()
  @IsOptional()
  warehouse_bin_id?: string;

  @ApiProperty({ example: '2025-09-26T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  inventory_date?: Date | string;

  @ApiProperty({ example: 'CHECKED', required: false })
  @IsString()
  @IsOptional()
  inventory_status?: string;

  @ApiProperty({ example: 'Stock take note', required: false })
  @IsString()
  @IsOptional()
  inventory_note?: string;

  @ApiProperty({ example: '2025-09-26T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  inspection_date?: Date | string;

  @ApiProperty({ example: 'inbound-uuid', required: false, description: 'ID dari inbound transaction untuk mencegah duplikasi history' })
  @IsString()
  @IsOptional()
  inbound_id?: string;

  @ApiProperty({ example: 'PROGRESS', required: false })
  @IsString()
  @IsOptional()
  progression_status?: ProgressionStatus;
}


