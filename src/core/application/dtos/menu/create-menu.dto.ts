import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMenuDto {
  @ApiProperty({ example: 'Dashboard' })
  @IsString()
  name: string;

  @ApiProperty({ example: '/dashboard' })
  @IsString()
  path: string;

  @ApiProperty({ example: 'dashboard', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
