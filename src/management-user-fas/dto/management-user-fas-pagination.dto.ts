import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class ManagementUserFasPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by organization (m_io) ID' })
  @IsOptional()
  @IsUUID()
  organization_id?: string;

  @ApiPropertyOptional({ example: 'fas.admin', description: 'Filter by name (partial match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'fas.admin@nna-id.com', description: 'Filter by email (partial match)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;
}
