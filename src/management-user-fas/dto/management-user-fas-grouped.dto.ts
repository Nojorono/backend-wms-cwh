import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ManagementUserFas } from '../../core/domain/entities/management-user-fas.entity';

export class ManagementUserFasFilterQueryDto {
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

  @ApiPropertyOptional({ description: 'Search name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ManagementUserFasGroupedByOrgDto {
  @ApiPropertyOptional({ example: '2047a6c0-14d7-4475-89cb-0f6b9282578e' })
  organization_id: string | null;

  @ApiPropertyOptional({ example: 'SMG' })
  organization_code?: string | null;

  @ApiPropertyOptional({ example: 'SEMARANG' })
  organization_name?: string | null;

  @ApiProperty({ type: [ManagementUserFas] })
  users: ManagementUserFas[];
}
