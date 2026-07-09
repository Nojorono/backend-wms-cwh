import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetBtbDateQueryDto {
  @ApiPropertyOptional({
    description: 'Cabang untuk kalender kerja. Kosongkan untuk kalender default global',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    example: '2026-07-04',
    description: 'Tanggal dasar. Default: hari ini (WIB)',
  })
  @IsOptional()
  @IsDateString()
  baseDate?: string;
}
