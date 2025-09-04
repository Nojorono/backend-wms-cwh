import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMenuDto {
  @ApiProperty({ example: 'Dashboard', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '/dashboard', required: false })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({ example: 'dashboard', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number | null;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
