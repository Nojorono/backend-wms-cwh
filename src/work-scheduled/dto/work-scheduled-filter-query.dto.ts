import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { WorkScheduledDayType } from '../../core/domain/entities/work-scheduled.entity';

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }

  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }

  return undefined;
}

export class WorkScheduledFilterQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 8, description: 'Bulan 1-12' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    description:
      'Filter cabang. Jika diisi, kalender default digabung dan entry cabang menimpa tanggal yang sama.',
    example: 'b8f8b2f4-2f2e-4c2a-9c2f-8b2f4b8f8b2f',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Set true untuk hanya kalender default global',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  defaultOnly?: boolean;

  @ApiPropertyOptional({ enum: WorkScheduledDayType })
  @IsOptional()
  @IsEnum(WorkScheduledDayType)
  dayType?: WorkScheduledDayType;
}
