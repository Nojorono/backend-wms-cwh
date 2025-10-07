import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { OutboundDoStatus, OutboundDoType } from '../../core/domain/entities/outbound-do.entity';

export class CreateOutboundDoDto {
  @ApiProperty({ example: 'DO-2025-001' })
  @IsString()
  outbound_do_number: string;

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
    type: [String], 
    example: ['uuid-memo-1', 'uuid-memo-2'],
    description: 'Array of outbound memo IDs'
  })
  @IsArray()
  @IsUUID('4', { each: true })
  outbound_memo_ids: string[];
}
