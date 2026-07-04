import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { WorkScheduledDayType } from '../../core/domain/entities/work-scheduled.entity';
import { TransformDate } from '../../core/utils/date-transformer.util';

export class CreateWorkScheduledDto {
  @ApiPropertyOptional({
    description: 'Kosongkan untuk kalender default global',
    example: 'b8f8b2f4-2f2e-4c2a-9c2f-8b2f4b8f8b2f',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({ example: '2026-08-17' })
  @IsDateString()
  @IsNotEmpty()
  @TransformDate()
  calendarDate: Date;

  @ApiProperty({ enum: WorkScheduledDayType, example: WorkScheduledDayType.HOLIDAY })
  @IsEnum(WorkScheduledDayType)
  dayType: WorkScheduledDayType;

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
  createdBy?: string;
}
