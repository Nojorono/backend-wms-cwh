import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ApproveRequestDto {
  @ApiPropertyOptional({
    example: 'uuid-user-123',
    description: 'User ID who is approving',
  })
  @IsOptional()
  @IsUUID(4, { message: 'approved_by must be a valid UUID' })
  approved_by?: string;

  @ApiPropertyOptional({
    example: 'Approved after review',
    description: 'Comments about the approval',
  })
  @IsOptional()
  @IsString({ message: 'comments must be a string' })
  comments?: string;
}

export class RejectRequestDto {
  @ApiProperty({
    example: 'Request does not meet requirements',
    description: 'Reason for rejection',
  })
  @IsString({ message: 'rejection_reason must be a string' })
  rejection_reason: string;

  @ApiPropertyOptional({
    example: 'uuid-user-123',
    description: 'User ID who is rejecting',
  })
  @IsOptional()
  @IsUUID(4, { message: 'rejected_by must be a valid UUID' })
  rejected_by?: string;

  @ApiPropertyOptional({
    example: 'Additional notes about the rejection',
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;
}

