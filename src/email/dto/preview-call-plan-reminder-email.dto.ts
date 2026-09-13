import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CallPlanReminderTemplateDto } from './call-plan-reminder-template.dto';

export class PreviewCallPlanReminderEmailDto {
  @ApiProperty({ type: CallPlanReminderTemplateDto })
  @ValidateNested()
  @Type(() => CallPlanReminderTemplateDto)
  body: CallPlanReminderTemplateDto;
}
