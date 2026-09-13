import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { DeliveryAttributeCategory } from '../../core/domain/entities/outbound-integration-deliveries.entity';

export class CreatePickReleaseSubdistDto {
  @ApiProperty({
    description: 'Transaction type',
    example: 'OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  transaction_type: string;

  @ApiProperty({
    description: 'Source system',
    example: 'WMS',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  source_system: string;

  @ApiProperty({
    description: 'Source header ID',
    example: '100000231',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  source_header_id: string;

  @ApiProperty({
    description: 'ISO header ID',
    example: 3001459,
  })
  @IsNumber()
  iso_header_id: number;

  @ApiProperty({
    description: 'ISO inventory item ID',
    example: 12000001,
  })
  @IsNumber()
  iso_inventory_item_id: number;

  @ApiProperty({
    description: 'ISO organization ID',
    example: 204,
  })
  @IsNumber()
  iso_organization_id: number;

  @ApiProperty({ enum: DeliveryAttributeCategory })
  @IsEnum(DeliveryAttributeCategory)
  delivery_attribute_category: DeliveryAttributeCategory;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute6?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute7?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute8?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute9?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute10?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute11?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute12?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute13?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute14?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  delivery_attribute15?: string;
}
