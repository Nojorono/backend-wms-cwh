import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateInboundDto, CreateInboundDoDto, CreateInboundItemDto } from './create-inbound.dto';

export class UpdateInboundItemDto extends PartialType(CreateInboundItemDto) {
  @ApiPropertyOptional({
    example: 'uuid-inbound-item-row-1',
    description:
      'Existing inbound_item row UUID (not master item_id). Omit to create a new line or match by item_id+uom.',
  })
  @IsOptional()
  @IsUUID(4, { message: 'id must be a valid UUID of inbound_item row' })
  id?: string;
}

export class UpdateInboundDoDto extends PartialType(
  OmitType(CreateInboundDoDto, ['inbound_items'] as const),
) {
  @ApiPropertyOptional({
    example: 'uuid-inbound-do-1',
    description: 'Existing DO id to update in place',
  })
  @IsOptional()
  @IsUUID(4, { message: 'id must be a valid UUID' })
  id?: string;

  @ApiPropertyOptional({
    type: () => UpdateInboundItemDto,
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'inbound_items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateInboundItemDto)
  inbound_items?: UpdateInboundItemDto[];
}

export class UpdateInboundDto extends PartialType(
  OmitType(CreateInboundDto, ['inbound_dos'] as const),
) {
  @ApiPropertyOptional({ description: 'Photo Condition' })
  @IsOptional()
  @IsString()
  photo_condition?: string;

  @ApiPropertyOptional({ description: 'Photo License Plate' })
  @IsOptional()
  @IsString()
  photo_license_plate?: string;

  @ApiPropertyOptional({ description: 'Photo Seal' })
  @IsOptional()
  @IsString()
  photo_seal?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: () => UpdateInboundDoDto,
    isArray: true,
    description: 'Update existing DOs by id (keeps ids). Omit id only for truly new DOs.',
  })
  @IsOptional()
  @IsArray({ message: 'inbound_dos must be an array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateInboundDoDto)
  inbound_dos?: UpdateInboundDoDto[];
}

export class UpdateInboundStatusDto {
  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
