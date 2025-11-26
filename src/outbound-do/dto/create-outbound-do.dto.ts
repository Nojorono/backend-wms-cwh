import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OutboundDoStatus, OutboundDoType } from '../../core/domain/entities/outbound-do.entity';

export class OutboundMemoItemDto {
  @ApiProperty({ example: 'b3a2d84c-7d29-4f47-bfb9-8158b17c5b8b' })
  @IsString()
  @IsUUID('4')
  memo_id: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  sequence: number;
}

export class CreateOutboundDoDto {
  @ApiPropertyOptional({ example: 'DO-2025-001', description: 'Auto-generated if not provided' })
  @IsOptional()
  @IsString()
  outbound_do_number?: string;

  @ApiProperty({ example: 'JNE Express' })
  @IsString()
  expedition: string;

  @ApiProperty({ example: 'Jakarta' })
  @IsString()
  origin: string;

  @ApiProperty({ example: 'B1234ABC' })
  @IsString()
  license_plate: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  driver_name: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  driver_phone: string;

  @ApiPropertyOptional({ enum: OutboundDoStatus, example: OutboundDoStatus.PENDING })
  @IsOptional()
  @IsEnum(OutboundDoStatus)
  status?: OutboundDoStatus;

  @ApiProperty({ enum: OutboundDoType, example: OutboundDoType.SUBDIST })
  @IsEnum(OutboundDoType)
  outbound_type: OutboundDoType;

  @ApiProperty({ example: '2025-01-15' })
  @IsDate()
  @Type(() => Date)
  delivery_date: Date;

  @ApiProperty({
    type: [OutboundMemoItemDto],
    example: [
      { memo_id: 'b3a2d84c-7d29-4f47-bfb9-8158b17c5b8b', sequence: 1 },
      { memo_id: 'uuid-memo-2', sequence: 2 },
    ],
    description: 'Array of outbound memo objects with sequence',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboundMemoItemDto)
  outbound_memo_ids: OutboundMemoItemDto[];
}
