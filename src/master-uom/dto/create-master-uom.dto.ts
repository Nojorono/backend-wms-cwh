import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterUomDto {
  @ApiProperty({ example: 'PCS' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Pieces' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Unit of measurement for counting items', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
} 