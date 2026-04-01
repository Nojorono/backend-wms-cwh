import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { OutboundDoStatus } from '../../core/domain/entities/outbound-do.entity';

export class OutboundReportQueryDto extends BasePaginationQueryDto {
  // @ApiPropertyOptional({
  //   description: 'Report: filter outbound DO by status',
  //   enum: OutboundDoStatus,
  //   example: OutboundDoStatus.PENDING,
  // })
  // @IsOptional()
  // @IsEnum(OutboundDoStatus)
  // status?: OutboundDoStatus;

  @ApiPropertyOptional({
    description: 'Report: filter by outbound DO created date (start, inclusive, ISO date)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Report: filter by outbound DO created date (end, inclusive, ISO date)',
    example: '2026-03-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
