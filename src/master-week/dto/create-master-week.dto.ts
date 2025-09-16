import { IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMasterWeekDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  BULAN?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  MINGGU?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  QUARTER?: number;

  @ApiProperty({ example: 2024, required: false })
  @IsNumber()
  @IsOptional()
  TAHUN?: number;

  @ApiProperty({ example: '2024-01-07', required: false })
  @IsDateString()
  @IsOptional()
  TANGGAL_AKHIR_MINGGU?: Date;

  @ApiProperty({ example: '2024-01-07', required: false })
  @IsDateString()
  @IsOptional()
  TANGGAL_AKHIR_MINGGU_REAL?: Date;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsDateString()
  @IsOptional()
  TANGGAL_AWAL_MINGGU?: Date;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsDateString()
  @IsOptional()
  TANGGAL_AWAL_MINGGU_REAL?: Date;
}
