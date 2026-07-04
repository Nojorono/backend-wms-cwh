import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { WorkScheduledDayType } from '../../core/domain/entities/work-scheduled.entity';

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
    description: 'Filter cabang. Gunakan "default" untuk kalender global',
    example: 'b8f8b2f4-2f2e-4c2a-9c2f-8b2f4b8f8b2f',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Set true untuk hanya kalender default global',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  defaultOnly?: boolean;

  @ApiPropertyOptional({ enum: WorkScheduledDayType })
  @IsOptional()
  @IsEnum(WorkScheduledDayType)
  dayType?: WorkScheduledDayType;
}
