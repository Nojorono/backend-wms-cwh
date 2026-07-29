import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class VoidDoDmsDto {
  @ApiProperty({
    example: 'SPB/CP-2026-0001/5001',
    description: 'Unique SPB number of the DO suggestion to void',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  spb_number: string;

  @ApiPropertyOptional({
    example: '020000149',
    description: 'Employee NIK of the user performing the void',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updated_by?: string;
}
