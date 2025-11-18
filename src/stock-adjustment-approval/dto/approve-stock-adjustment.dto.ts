import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ApproveStockAdjustmentDto {
  @ApiPropertyOptional({
    example: 'uuid-user-123',
    description: 'User ID who approved the adjustment',
  })
  @IsOptional()
  @IsUUID(4, { message: 'approved_by must be a valid UUID' })
  approved_by?: string;

  @ApiPropertyOptional({
    example: 'Additional notes about the approval',
    description: 'Approval notes',
  })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;
}

export class RejectStockAdjustmentDto {
  @ApiProperty({
    example: 'Quantity adjustment exceeds acceptable threshold',
    description: 'Reason for rejection',
  })
  @IsString({ message: 'rejection_reason must be a string' })
  rejection_reason: string;

  @ApiPropertyOptional({
    example: 'uuid-user-123',
    description: 'User ID who rejected the adjustment',
  })
  @IsOptional()
  @IsUUID(4, { message: 'rejected_by must be a valid UUID' })
  rejected_by?: string;

  @ApiPropertyOptional({
    example: 'Additional notes about the rejection',
    description: 'Rejection notes',
  })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;
}

