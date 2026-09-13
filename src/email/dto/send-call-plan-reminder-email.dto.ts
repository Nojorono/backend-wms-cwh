import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, ValidateNested } from 'class-validator';
import { CallPlanReminderTemplateDto } from './call-plan-reminder-template.dto';
import { SmtpConfigDto } from './smtp-config.dto';

export class SendCallPlanReminderEmailDto {
  @ApiPropertyOptional({ type: SmtpConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmtpConfigDto)
  smtp?: SmtpConfigDto;

  @ApiProperty({
    example: ['supervisor@company.com'],
    description: 'Supervisor email (TO)',
    type: [String],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  supervisorEmail: string[];

  @ApiPropertyOptional({
    example: ['ahom@company.com'],
    description: 'AHOM email (CC). Optional — email still sent to supervisor if omitted.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  ahomEmail?: string[];

  @ApiProperty({ type: CallPlanReminderTemplateDto })
  @ValidateNested()
  @Type(() => CallPlanReminderTemplateDto)
  body: CallPlanReminderTemplateDto;
}
