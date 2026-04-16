import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterWarehouseDto {
  @ApiProperty({ example: 1, required: false })
  @IsUUID(4, { message: 'organization_id must be a valid UUID' })
  @IsOptional()
  organization_id?: string;

  @ApiProperty({ example: 'Main Warehouse', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Primary warehouse for storing inventory',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  locator_id?: number;

  @ApiProperty({ example: 'Locator Name', required: false })
  @IsString()
  @IsOptional()
  locator_name?: string;
}
