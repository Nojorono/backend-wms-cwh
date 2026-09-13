import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { OutboundDoStatus, OutboundDoType } from '../../core/domain/entities/outbound-do.entity';
import { Status as TransactionPickingStatus } from '../../core/domain/entities/transaction-picking.entity';

export class OutboundDoPaginationDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter outbound DO by status',
    enum: OutboundDoStatus,
    example: OutboundDoStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OutboundDoStatus)
  status?: OutboundDoStatus;

  @ApiPropertyOptional({
    description: 'Filter outbound DO by outbound type',
    enum: OutboundDoType,
    example: OutboundDoType.SUBDIST,
  })
  @IsOptional()
  @IsEnum(OutboundDoType)
  outbound_type?: OutboundDoType;

  @ApiPropertyOptional({
    description: 'Filter outbound DO that have transaction scan picking',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  has_transaction_scan_picking?: boolean;

  @ApiPropertyOptional({
    description: 'Filter outbound DO by transaction picking status',
    enum: TransactionPickingStatus,
    example: TransactionPickingStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(TransactionPickingStatus)
  transaction_picking_status?: TransactionPickingStatus;

  @ApiPropertyOptional({
    description: 'Filter by created date (start, inclusive, ISO date)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by created date (end, inclusive, ISO date)',
    example: '2026-03-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}


