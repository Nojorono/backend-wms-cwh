import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { BasePaginationQueryDto } from '../../core/dto/base-pagination.dto';
import { PalletUpdateType, PalletUpdateStatus } from '../../core/domain/entities/pallet-update.entity';

export class PalletUpdatePaginationQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter pallet updates by update type',
    enum: PalletUpdateType,
    example: PalletUpdateType.UPDATE_PROD_CODE_UOM,
  })
  @IsOptional()
  @IsEnum(PalletUpdateType, { message: 'updateType must be a valid PalletUpdateType' })
  updateType?: PalletUpdateType;

  @ApiPropertyOptional({
    description: 'Filter pallet updates by status',
    enum: PalletUpdateStatus,
    example: PalletUpdateStatus.PENDING_ASSIGNMENT,
  })
  @IsOptional()
  @IsEnum(PalletUpdateStatus, { message: 'status must be a valid PalletUpdateStatus' })
  status?: PalletUpdateStatus;
}
