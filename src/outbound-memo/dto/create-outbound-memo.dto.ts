import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OutboundMemoStatus } from '../../core/domain/entities/outbound-memo.entity';

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
  @IsString()
  destination: string;

  @ApiProperty({ example: '2025-01-15' })
  @IsDate()
  @Type(() => Date)
  delivery_date: Date;

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
