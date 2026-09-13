import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreatePalletUpdateAssignedDto {
  @ApiPropertyOptional({ example: 'uuid-pallet-update-123' })
  @IsOptional()
  @IsUUID(4, { message: 'palletUpdateId must be a valid UUID' })
  palletUpdateId?: string;

  @ApiProperty({ example: 'uuid-user-123' })
  @IsUUID(4, { message: 'userId must be a valid UUID' })
  userId: string;

  @ApiPropertyOptional({ example: '2025-01-26T10:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'assignedAt must be a valid ISO date string' })
  assignedAt?: string;
}
