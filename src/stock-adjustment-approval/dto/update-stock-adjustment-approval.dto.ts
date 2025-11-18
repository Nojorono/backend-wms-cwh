import { PartialType } from '@nestjs/swagger';
import { CreateStockAdjustmentApprovalDto } from './create-stock-adjustment-approval.dto';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStockAdjustmentApprovalDto extends PartialType(CreateStockAdjustmentApprovalDto) {
  @ApiPropertyOptional({
    example: 'Updated reason for the adjustment',
    description: 'Updated reason',
  })
  @IsOptional()
  @IsString({ message: 'reason must be a string' })
  reason?: string;

  @ApiPropertyOptional({
    example: 'Updated notes',
    description: 'Updated notes',
  })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({
    example: 'uuid-target-pallet-123',
    description: 'Target pallet ID to move excess quantity to',
  })
  @IsOptional()
  @IsUUID(4, { message: 'target_pallet_id must be a valid UUID' })
  target_pallet_id?: string;
}

