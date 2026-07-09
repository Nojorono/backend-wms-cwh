import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetCallplanDateQueryDto {
  @ApiPropertyOptional({
    description: 'Cabang untuk kalender kerja. Kosongkan untuk kalender default global',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    example: '2026-07-04',
    description: 'Tanggal dasar DO suggestion. Default: hari ini (WIB)',
  })
  @IsOptional()
  @IsDateString()
  baseDate?: string;
}
