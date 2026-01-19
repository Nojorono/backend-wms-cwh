import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { ApprovalStatus, EntityType } from '../../core/domain/entities/approval.entity';

export class ApprovalPaginationDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by approval status',
    enum: ApprovalStatus,
    example: ApprovalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ApprovalStatus, { message: 'status must be a valid ApprovalStatus' })
  status?: ApprovalStatus;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: EntityType,
    example: EntityType.STOCK_ADJUSTMENT,
  })
  @IsOptional()
  @IsEnum(EntityType, { message: 'entity_type must be a valid EntityType' })
  entity_type?: EntityType;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
    example: 'uuid-entity-123',
  })
  @IsOptional()
  entity_id?: string;
}

