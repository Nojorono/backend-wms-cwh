
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ScanPickingStatus } from 'src/core/domain/entities/transaction-scan-picking.entity';

export class UpdateStatusDto {
  @ApiProperty({ enum: ScanPickingStatus, description: 'Status to update' })
  @IsNotEmpty()
  @IsEnum(ScanPickingStatus)
  status: ScanPickingStatus;

  @ApiPropertyOptional({ description: 'User who performed the operation', example: 'John Doe' })
  @IsOptional()
  @IsString()
  inspection_by?: string;

  @ApiProperty({ 
    description: 'Transaction scan picking IDs', 
    example: ['47078b39-4010-4fc3-8011-74dc4495bf4f'],
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}

