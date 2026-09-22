import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SmtpConfigDto } from './smtp-config.dto';

export class EmailAttachmentDto {
  @ApiProperty({ example: 'report.xlsx', description: 'Attachment file name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename: string;

  @ApiProperty({
    example: 'UEsDBBQAAAAI...',
    description: 'File content as base64 string (default) or plain text if encoding is utf8',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'base64',
    enum: ['base64', 'utf8', 'hex'],
    default: 'base64',
    description: 'Encoding of content field',
  })
  @IsOptional()
  @IsIn(['base64', 'utf8', 'hex'])
  encoding?: 'base64' | 'utf8' | 'hex';

  @ApiPropertyOptional({
    example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    description: 'MIME content type',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contentType?: string;

  @ApiPropertyOptional({
    example: 'logo@cid',
    description: 'Content-ID for inline HTML images (cid:...)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cid?: string;
}

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

  @ApiPropertyOptional({
    type: [EmailAttachmentDto],
    description: 'Optional file attachments (base64 content by default)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}
