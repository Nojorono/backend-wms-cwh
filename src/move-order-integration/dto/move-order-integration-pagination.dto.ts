import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class MoveOrderIntegrationPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by interface status',
    example: 'INTEGRATED',
  })
  @IsOptional()
  @IsString()
  iface_status?: string;

  @ApiPropertyOptional({
    description: 'Filter by source system',
    example: 'WMS',
  })
  @IsOptional()
  @IsString()
  source_system?: string;
}
