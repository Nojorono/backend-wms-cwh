import { IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class WeekListQueryDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  BULAN?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  MINGGU?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  QUARTER?: number;

  @ApiProperty({ example: 2024, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  TAHUN?: number;

  @ApiProperty({ example: '2024-01-07', required: false })
  @IsOptional()
  @IsDateString()
  TANGGAL_AKHIR_MINGGU?: Date;

  @ApiProperty({ example: '2024-01-07', required: false })
  @IsOptional()
  @IsDateString()
  TANGGAL_AKHIR_MINGGU_REAL?: Date;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  TANGGAL_AWAL_MINGGU?: Date;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  TANGGAL_AWAL_MINGGU_REAL?: Date;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}
