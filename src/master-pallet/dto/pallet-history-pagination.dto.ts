import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { QuantityOperationType } from '../../core/domain/entities/transaction-pallet-history.entity';

export class PalletHistoryPaginationDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan tipe operasi kuantitas',
    enum: QuantityOperationType,
    example: QuantityOperationType.ADD,
  })
  @IsOptional()
  @IsEnum(QuantityOperationType)
  operation_type?: QuantityOperationType;
}


