import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class InboundIntegrationPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by integration status',
    example: 'CREATED',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by inbound ID',
  })
  @IsOptional()
  @IsString()
  inbound_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by inbound DO ID',
  })
  @IsOptional()
  @IsString()
  inbound_do_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by source system',
    example: 'WMS',
  })
  @IsOptional()
  @IsString()
  source_system?: string;
}
