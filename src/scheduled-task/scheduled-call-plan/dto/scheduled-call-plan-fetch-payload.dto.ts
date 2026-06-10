import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ScheduledCallPlanFetchPayloadDto {
  @ApiPropertyOptional({
    example: '2026-06-10',
    description: 'CALL_PLAN_START_DATE (YYYY-MM-DD). Default: today WIB + 2 days',
  })
  @IsOptional()
  @IsDateString()
  callPlanStartDate?: string;
}
