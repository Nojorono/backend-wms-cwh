import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';

export class TransactionPickingPaginationDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter transaction picking berdasarkan status',
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter transaction picking berdasarkan apakah memiliki memo_id (true = memiliki memo, false = tidak memiliki memo)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true') return true;
      if (lower === 'false') return false;
    }
    return value;
  })
  @IsBoolean()
  has_memo_id?: boolean;

  @ApiPropertyOptional({
    description: 'Filter transaction picking berdasarkan item_id',
    example: 'uuid-item-id',
  })
  @IsOptional()
  @IsString()
  item_id?: string;
}

