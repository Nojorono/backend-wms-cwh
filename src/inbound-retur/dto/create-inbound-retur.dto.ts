import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InboundReturStatus } from '../../core/domain/entities/inbound-retur.entity';
import { CreateInboundReturHelperDto } from './create-inbound-retur-helper.dto';
import { CreateInboundReturItemDto } from './create-inbound-retur-item.dto';

export class CreateInboundReturDto {
  @ApiPropertyOptional({ example: 'uuid-reference-123' })
  @IsOptional()
  @IsString()
  inbound_retur_id_reference?: string;

  @ApiPropertyOptional({ example: 'INR-META-YYYY-NNNN' })
  @IsOptional()
  @IsString()
  meta_number?: string;

  @ApiPropertyOptional({ example: 'Carrier A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  expedition?: string;

  @ApiPropertyOptional({ example: 'Factory 1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  origin?: string;

  @ApiPropertyOptional({ example: 'B 1234 XYZ' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z0-9\s]*$/, {
    message: 'license_plate must contain only uppercase letters, numbers, and spaces',
  })
  license_plate?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  driver_name?: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'driver_phone must be a valid phone number' })
  driver_phone?: string;

  @ApiPropertyOptional({ enum: InboundReturStatus, example: InboundReturStatus.CREATED })
  @IsOptional()
  @IsEnum(InboundReturStatus)
  status?: InboundReturStatus;

  @ApiPropertyOptional({ example: 'RETUR' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  inbound_retur_type?: string;

  @ApiPropertyOptional({ example: '2025-01-28T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  arrival_date?: string;

  @ApiPropertyOptional({ example: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: () => [CreateInboundReturItemDto],
    example: [{ item_id: 'uuid-item-1', quantity: 10, uom: 'PCS' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInboundReturItemDto)
  inbound_retur_items?: CreateInboundReturItemDto[];
}
