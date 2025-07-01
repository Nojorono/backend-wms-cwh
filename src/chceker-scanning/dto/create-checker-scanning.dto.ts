import { IsString, IsOptional, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckerScanningDto {
  @ApiProperty({ 
    description: 'ID of the inbound transporter',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  inbound_transporter_id: string;

  @ApiProperty({ 
    description: 'ID of the organization',
    example: 1
  })
  @IsNumber()
  organization_id: number;

  @ApiProperty({ 
    description: 'ID of the inbound plan',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsUUID()
  inbound_plan_id: string;

  @ApiProperty({ 
    description: 'ID of the inbound plan item',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  inbound_plan_item_id: string;

  @ApiProperty({ 
    description: 'ID of the checker assignment',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false
  })
  @IsUUID()
  @IsOptional()
  checker_assign_id?: string;

  @ApiProperty({ 
    description: 'ID of the checker user',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  @IsUUID()
  checker_id: string;

  @ApiProperty({ 
    description: 'Actual quantity scanned',
    example: 100.50
  })
  @IsNumber()
  actual_qty: number;

  @ApiProperty({ 
    description: 'Pallet code',
    example: 'PALLET-001',
    required: false
  })
  @IsString()
  @IsOptional()
  pallet_code?: string;

  @ApiProperty({ 
    description: 'Created by',
    example: '123e4567-e89b-12d3-a456-426614174003'
  })
  @IsString()
  created_by: string;

  @ApiProperty({ 
    description: 'Updated by',
    example: '123e4567-e89b-12d3-a456-426614174004'
  })
  @IsString()
  updated_by: string;

  @ApiProperty({ 
    description: 'Created at',
    example: '2024-01-15T10:30:00Z'
  })
  @IsDateString()
  created_at: Date;

  @ApiProperty({ 
    description: 'Updated at',
    example: '2024-01-15T10:30:00Z'
  })
  @IsDateString()
  updated_at: Date;
} 