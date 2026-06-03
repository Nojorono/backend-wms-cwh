import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OutboundMemoStatus, OutboundMemoType } from '../../core/domain/entities/outbound-memo.entity';
import { TransformDate } from '../../core/utils/date-transformer.util';

export class CreateOutboundMemoItemDto {
  @ApiProperty({ example: 'uuid-item-123' })
  @IsString()
  item_id: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Type(() => Number)
  quantity_plan: number;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString()
  uom?: string;
}

export class CreateOutboundMemoDto {
  @ApiPropertyOptional({ example: 'uuid-organization-123' })
  @IsOptional()
  @IsUUID(4, { message: 'organization_id must be a valid UUID' })
  organization_id?: string;

  @ApiPropertyOptional({ example: 'string' })
  @IsOptional()
  @IsString()
  so_organization_id?: string;

  @ApiPropertyOptional({ example: 'SO-2025-001' })
  @IsOptional()
  @IsString()
  so_number?: string;

  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @IsNumber()
  header_id?: number;

  @ApiProperty({ example: 'OM-2025-001' })
  @IsOptional()
  @IsString()
  outbound_memo_number?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  requestor: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsString()
  origin: string;

  @ApiProperty({ example: 'PT ABC' })
  @IsString()
  ship_to: string;

  @ApiProperty({ example: 'Surabaya' })
  @IsOptional()
  @IsString()
  destination: string;

  @ApiProperty({ example: 'uuid-destination-io-123' })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'destination_io_id must be a valid UUID' })
  destination_io_id?: string;

  @ApiProperty({ example: '2025-01-15T00:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  @TransformDate()
  delivery_date: Date;

  @ApiProperty({ enum: OutboundMemoType, example: OutboundMemoType.SUBDIST })
  @IsEnum(OutboundMemoType)
  type: OutboundMemoType; // SUBDIST or AMO

  @ApiPropertyOptional({ example: 'Catatan pengiriman' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: OutboundMemoStatus, example: OutboundMemoStatus.PENDING })
  @IsOptional()
  @IsEnum(OutboundMemoStatus)
  status?: OutboundMemoStatus;

  @ApiProperty({ type: [CreateOutboundMemoItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOutboundMemoItemDto)
  outbound_memo_items: CreateOutboundMemoItemDto[];
}
