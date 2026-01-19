import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, ValidateIf } from 'class-validator';
import { AssignedGatePalletStatus } from '../../core/domain/entities/assigned-gate-pallet.entity';

export class CreateAssignedGatePalletDto {
  @ApiPropertyOptional({
    description: 'Assigned Gate Pallet ID (required for update, optional for create)',
    example: 'uuid-assigned-gate-pallet-123',
  })
  @IsOptional()
  @ValidateIf((o) => o.id !== undefined && o.id !== null)
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Pallet ID',
    example: 'uuid-pallet-123',
  })
  @IsString()
  pallet_id: string;

  @ApiPropertyOptional({
    description: 'Status of the assigned gate pallet',
    enum: AssignedGatePalletStatus,
    example: AssignedGatePalletStatus.ASSIGNED,
  })
  @IsOptional()
  @IsEnum(AssignedGatePalletStatus)
  status?: AssignedGatePalletStatus;
}

