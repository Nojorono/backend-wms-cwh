import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { EntityType } from '../../core/domain/entities/approval.entity';

export class ApprovalSetupPaginationDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: EntityType,
    example: EntityType.STOCK_ADJUSTMENT,
  })
  @IsOptional()
  @IsEnum(EntityType, { message: 'entity_type must be a valid EntityType' })
  entity_type?: EntityType;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean;
}

