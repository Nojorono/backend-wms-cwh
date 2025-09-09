import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class InboundPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({ 
    description: 'Filter inbounds by status',
    example: 'CREATED'
  })
  @IsOptional()
  @IsString()
  status?: string;
}
