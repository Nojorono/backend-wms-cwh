import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SmtpConfigDto } from './smtp-config.dto';

export class SendEmailDto {
  @ApiPropertyOptional({
    type: SmtpConfigDto,
    description: 'Dynamic SMTP config. Omit to use SMTP_* environment variables.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmtpConfigDto)
  smtp?: SmtpConfigDto;

  @ApiProperty({
    example: ['user@example.com'],
    description: 'Recipient email addresses',
    type: [String],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @ApiPropertyOptional({ example: ['cc@example.com'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({ example: ['bcc@example.com'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiProperty({ example: 'Opening balance confirmed', description: 'Email subject' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subject: string;

  @ApiPropertyOptional({ example: 'Your opening balance has been confirmed.' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    example: '<p>Your opening balance has been <b>confirmed</b>.</p>',
    description: 'HTML body (optional if text is provided)',
  })
  @IsOptional()
  @IsString()
  html?: string;
}
