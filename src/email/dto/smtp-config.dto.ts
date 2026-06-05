import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Dynamic SMTP connection settings — overrides env defaults when provided. */
export class SmtpConfigDto {
  @ApiProperty({ example: 'mail.nna-id.com', description: 'SMTP server host' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  host: string;

  @ApiProperty({ example: 465, description: 'SMTP port (465 = SSL/TLS, 587 = STARTTLS)' })
  @IsInt()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  port: number;

  @ApiPropertyOptional({
    example: true,
    description: 'SSL/TLS — true for port 465 (NNA), false for STARTTLS on 587',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  secure?: boolean;

  @ApiPropertyOptional({ example: 'noreply@nna-id.com', description: 'SMTP auth username' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  user?: string;

  @ApiPropertyOptional({ example: 'app-password', description: 'SMTP auth password' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pass?: string;

  @ApiProperty({
    example: 'NNA WMS <noreply@nna-id.com>',
    description: 'Default sender address (From)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  from: string;

  @ApiPropertyOptional({
    example: 'noreply@nna-id.com',
    description: 'Reply-To address',
  })
  @IsOptional()
  @IsEmail()
  reply_to?: string;
}
