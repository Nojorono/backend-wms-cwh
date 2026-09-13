import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class OutboundIntegrationIrReqPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by iface_status_ir',
    example: 'S',
  })
  @IsOptional()
  @IsString()
  iface_status_ir?: string;

  @ApiPropertyOptional({
    description: 'Filter by outbound DO ID',
  })
  @IsOptional()
  @IsString()
  outbound_do_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by outbound memo ID',
  })
  @IsOptional()
  @IsString()
  outbound_memo_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
  })
  @IsOptional()
  @IsString()
  transaction_type?: string;
}
