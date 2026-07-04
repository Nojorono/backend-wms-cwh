import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetCallplanDateSubmittedQueryDto {
  @ApiPropertyOptional({
    description: 'Cabang untuk kalender kerja. Kosongkan untuk kalender default global',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    example: '2026-07-04',
    description:
      'Hari persiapan admin gudang. Default: hari ini (WIB). ' +
      'Hasil = callplan_date yang harus disiapkan (baseDate + 1 hari kerja).',
  })
  @IsOptional()
  @IsDateString()
  baseDate?: string;
}
