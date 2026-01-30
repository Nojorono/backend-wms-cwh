import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InboundReturSortingStatus } from '../../core/domain/entities/inbound-retur-sorting.entity';

export class CreateInboundReturSortingDto {
  @ApiPropertyOptional({ example: 'uuid-inbound-retur-1' })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'inbound_retur_id must be a valid UUID' })
  inbound_retur_id?: string;

  @ApiProperty({ example: 'uuid-item-1' })
  @IsString()
  @IsUUID(4, { message: 'item_id must be a valid UUID' })
  item_id: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity_claim?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity_unclaim?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity_tracking?: number;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  uom?: string;

  @ApiPropertyOptional({ example: 'HJE-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  hje?: string;

  @ApiPropertyOptional({ example: '2025' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  year?: string;

  @ApiPropertyOptional({ example: 'Sorting notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({
    enum: InboundReturSortingStatus,
    example: InboundReturSortingStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(InboundReturSortingStatus)
  status?: InboundReturSortingStatus;
}
