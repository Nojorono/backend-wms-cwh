import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class BtbPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ example: 'DRAFT' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by organization (m_io) ID' })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sales_nik?: string;

  @ApiPropertyOptional({ example: '87654321' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sales_spv_nik?: string;

  @ApiPropertyOptional({ example: '2026-07-01', description: 'Filter btb_date >= this date' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2026-07-31', description: 'Filter btb_date <= this date' })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}
