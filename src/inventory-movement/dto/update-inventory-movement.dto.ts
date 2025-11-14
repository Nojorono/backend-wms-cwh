import { PartialType } from '@nestjs/swagger';
import { CreateInventoryMovementDto } from './create-inventory-movement.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { MovementStatus } from '../../core/domain/entities/inventory-movement.entity';

export class UpdateInventoryMovementDto extends PartialType(CreateInventoryMovementDto) {
  @ApiPropertyOptional({
    description: 'Status movement',
    enum: MovementStatus,
  })
  @IsOptional()
  @IsEnum(MovementStatus)
  status?: MovementStatus;

  @ApiPropertyOptional({ description: 'Tanggal selesai movement', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  completed_date?: string;

  @ApiPropertyOptional({ description: 'User yang menyelesaikan movement' })
  @IsOptional()
  @IsString()
  moved_by?: string;
}

