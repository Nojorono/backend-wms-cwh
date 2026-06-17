import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ScheduledTaskPayload } from '../../core/domain/types/scheduled-task-payload.interface';

export class CreateCronTaskDto {
  @ApiProperty({ example: 'fetch-all-call-plan-h2' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '0 8 * * *', description: 'Cron expression (node-cron)' })
  @IsString()
  @IsNotEmpty()
  cronTime: string;

  @ApiProperty({ example: 'fetchAllCallPlan' })
  @IsString()
  @IsNotEmpty()
  callbackType: string;

  @ApiPropertyOptional({ example: 'Asia/Jakarta' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Callback-specific JSON payload' })
  @IsOptional()
  @IsObject()
  payload?: ScheduledTaskPayload;
}
