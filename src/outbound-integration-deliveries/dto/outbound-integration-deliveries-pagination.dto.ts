import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class OutboundIntegrationDeliveriesPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by create_delivery_status / ship_confirm_status search context',
    example: 'S',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction_type',
    example: 'SHIP_CONFIRM',
  })
  @IsOptional()
  @IsString()
  transaction_type?: string;

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
    description: 'Filter by source system',
    example: 'WMS',
  })
  @IsOptional()
  @IsString()
  source_system?: string;
}
