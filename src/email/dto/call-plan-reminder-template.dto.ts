import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CallPlanReminderSalesRowDto } from './call-plan-reminder-sales-row.dto';

export class CallPlanReminderTemplateDto {
  @ApiProperty({ example: '2026-06-02' })
  @IsDateString()
  callPlanStartDate: string;

  @ApiProperty({ example: 'JOG' })
  @IsString()
  @IsNotEmpty()
  cabang: string;

  @ApiProperty({ example: 'AHMAD GAHAR HABIBIE' })
  @IsString()
  @IsNotEmpty()
  supervisorName: string;

  @ApiProperty({ example: '250416.00028BC' })
  @IsString()
  @IsNotEmpty()
  supervisorNik: string;

  @ApiProperty({ example: 'DAVID PALGUNA' })
  @IsString()
  @IsNotEmpty()
  ahomName: string;

  @ApiProperty({ example: '250801.00030DA' })
  @IsString()
  @IsNotEmpty()
  ahomNik: string;

  @ApiProperty({ type: [CallPlanReminderSalesRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CallPlanReminderSalesRowDto)
  sales: CallPlanReminderSalesRowDto[];

  @ApiPropertyOptional({ example: '22 Jun 2026, 15.30' })
  @IsOptional()
  @IsString()
  generatedAt?: string;
}
