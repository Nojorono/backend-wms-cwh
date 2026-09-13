import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterDepartementDto {
  @ApiProperty({ example: 'DEP001', required: false })
  @IsString()
  @IsOptional()
  departement_code?: string;

  @ApiProperty({ example: 'Finance', required: false })
  @IsString()
  @IsOptional()
  departement_name?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
