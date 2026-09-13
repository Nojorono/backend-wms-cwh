import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOrUpdateInventoryTrackingDto {
  @ApiProperty({ example: 'pallet-uuid', description: 'Pallet ID' })
  @IsNotEmpty()
  @IsString()
  pallet_id: string;

  @ApiProperty({ example: 'warehouse-sub-uuid', description: 'Warehouse sub ID' })
  @IsNotEmpty()
  @IsString()
  warehouse_sub_id: string;

  @ApiProperty({ example: 'warehouse-uuid', description: 'Warehouse ID' })
  @IsNotEmpty()
  @IsString()
  warehouse_id: string;

  @ApiProperty({ example: 'IN_INVENTORY', description: 'Inventory status' })
  @IsNotEmpty()
  @IsString()
  inventory_status: string;

  @ApiPropertyOptional({ example: 'inbound-uuid', description: 'Inbound ID' })
  @IsOptional()
  @IsString()
  inbound_id?: string;
}
