import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { OutboundDoStatus, OutboundDoType } from '../../core/domain/entities/outbound-do.entity';

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
}


