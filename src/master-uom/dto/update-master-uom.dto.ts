import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterUomDto {
  @ApiProperty({ example: 'PCS', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'Pieces', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Unit of measurement for counting items',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
