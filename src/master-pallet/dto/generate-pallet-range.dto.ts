import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GeneratePalletRangeDto {
  @ApiProperty({ example: 'PAL-' })
  @IsString()
  prefix: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  start: number;

  @ApiProperty({ example: 1000 })
  @IsInt()
  @Min(1)
  end: number;

  @ApiPropertyOptional({ example: 4, default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  padding?: number = 4;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  organization_id?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
