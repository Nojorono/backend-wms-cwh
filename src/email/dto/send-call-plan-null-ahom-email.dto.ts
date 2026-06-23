import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsOptional, ValidateNested } from 'class-validator';
import { CallPlanNullAhomTemplateDto } from './call-plan-null-ahom-template.dto';
import { SmtpConfigDto } from './smtp-config.dto';

export class SendCallPlanNullAhomEmailDto {
  @ApiPropertyOptional({ type: SmtpConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmtpConfigDto)
  smtp?: SmtpConfigDto;

  @ApiProperty({
    example: ['ahom@company.com'],
    description: 'AHOM email (TO)',
    type: [String],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  ahomEmail: string[];

  @ApiPropertyOptional({
    example: ['supervisor1@company.com', 'supervisor2@company.com'],
    description: 'Supervisor emails (CC)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  supervisorEmail?: string[];

  @ApiProperty({ type: CallPlanNullAhomTemplateDto })
  @ValidateNested()
  @Type(() => CallPlanNullAhomTemplateDto)
  body: CallPlanNullAhomTemplateDto;
}
