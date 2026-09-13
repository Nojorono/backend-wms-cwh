import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class InboundReportQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Report: filter inbounds by status',
    example: 'CREATED',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Report: filter by inbound created date (start, inclusive, ISO date)',
    example: '2026-03-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Report: filter by inbound created date (end, inclusive, ISO date)',
    example: '2026-03-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
