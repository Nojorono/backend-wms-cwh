import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GenerateWorkScheduledDto {
  @ApiProperty({ example: 2026, description: 'Tahun kalender yang akan di-generate' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  year: number;

  @ApiPropertyOptional({
    description: 'Kosongkan untuk kalender default global (organization_id = null)',
    example: 'b8f8b2f4-2f2e-4c2a-9c2f-8b2f4b8f8b2f',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Jika true, tanggal yang sudah ada akan di-overwrite',
  })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean;

  @ApiPropertyOptional({
    default: true,
    description: 'Sertakan cuti bersama sebagai HOLIDAY',
  })
  @IsOptional()
  @IsBoolean()
  includeJointLeave?: boolean;

  @ApiPropertyOptional({ example: 'EMP001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  createdBy?: string;
}
