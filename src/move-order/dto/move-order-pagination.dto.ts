import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { MoveOrderStatus, MoveOrderType } from '../../core/domain/entities/move-order.entity';

export class MoveOrderPaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter move orders by status',
    enum: MoveOrderStatus,
    example: MoveOrderStatus.CREATED,
  })
  @IsOptional()
  @IsEnum(MoveOrderStatus, { message: 'status must be a valid MoveOrderStatus' })
  status?: MoveOrderStatus;

  @ApiPropertyOptional({
    description: 'Filter move orders by type',
    enum: MoveOrderType,
    example: MoveOrderType.TRANSFER_DIFFERENCE,
  })
  @IsOptional()
  @IsEnum(MoveOrderType, { message: 'type must be a valid MoveOrderType' })
  type?: MoveOrderType;
}

