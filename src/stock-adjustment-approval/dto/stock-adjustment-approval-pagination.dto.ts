import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { ApprovalStatus } from '../../core/domain/entities/approval.entity';

export class StockAdjustmentApprovalPaginationDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter approval requests by status',
    enum: ApprovalStatus,
    example: ApprovalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ApprovalStatus, { message: 'status must be a valid ApprovalStatus' })
  status?: ApprovalStatus;

  @ApiPropertyOptional({
    description: 'Filter by pallet ID',
    example: 'uuid-pallet-123',
  })
  @IsOptional()
  pallet_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by item ID',
    example: 'uuid-item-123',
  })
  @IsOptional()
  item_id?: string;
}

