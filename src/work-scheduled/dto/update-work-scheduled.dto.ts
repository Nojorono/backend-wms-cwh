import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { WorkScheduledDayType } from '../../core/domain/entities/work-scheduled.entity';

export class UpdateWorkScheduledDto {
  @ApiPropertyOptional({ enum: WorkScheduledDayType })
  @IsOptional()
  @IsEnum(WorkScheduledDayType)
  dayType?: WorkScheduledDayType;

  @ApiPropertyOptional({ example: 'Hari Kemerdekaan RI' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Libur nasional' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'EMP001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  updatedBy?: string;
}
