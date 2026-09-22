import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Multer file shape for multipart email attachments. */
export interface EmailUploadFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

function parseEmailList(value: unknown): string[] | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  const parts = Array.isArray(value)
    ? value.flatMap((entry) => String(entry).split(','))
    : String(value).split(',');

  const emails = parts.map((entry) => entry.trim()).filter(Boolean);
  return emails.length ? emails : undefined;
}

/** Form fields for multipart email send (Swagger file upload). */
export class SendEmailMultipartDto {
  @ApiProperty({
    example: 'user@example.com,other@example.com',
    description: 'Recipients — comma-separated or repeated form fields',
  })
  @Transform(({ value }) => parseEmailList(value))
  @IsArray()
  @IsEmail({}, { each: true })
  to: string[];

  @ApiPropertyOptional({
    example: 'cc@example.com',
    description: 'CC — comma-separated',
  })
  @IsOptional()
  @Transform(({ value }) => parseEmailList(value))
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({
    example: 'bcc@example.com',
    description: 'BCC — comma-separated',
  })
  @IsOptional()
  @Transform(({ value }) => parseEmailList(value))
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiProperty({ example: 'Opening balance confirmed' })
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
  })
  @IsOptional()
  @IsString()
  html?: string;
}
