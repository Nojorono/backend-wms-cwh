import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { OutboundMemoStatus, OutboundMemoType } from '../../core/domain/entities/outbound-memo.entity';

export class OutboundMemoPaginationDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter outbound memo berdasarkan status',
    enum: OutboundMemoStatus,
    example: OutboundMemoStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(OutboundMemoStatus)
  status?: OutboundMemoStatus;

  @ApiPropertyOptional({
    description: 'Filter outbound memo berdasarkan apakah sudah memiliki outbound DO',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true') return true;
      if (lower === 'false') return false;
    }
    return value;
  })
  @IsBoolean()
  has_do?: boolean;

  @ApiPropertyOptional({
    description: 'Filter outbound memo berdasarkan type',
    enum: OutboundMemoType,
    example: OutboundMemoType.SUBDIST,
  })
  @IsOptional()
  @IsEnum(OutboundMemoType)
  type?: OutboundMemoType; // SUBDIST or AMO

  @ApiPropertyOptional({
    description: 'Filter outbound memo yang memiliki transaction scan picking',
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true') return true;
      if (lower === 'false') return false;
    }
    return value;
  })
  has_transaction_scan_picking?: boolean;
}


