import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInboundAttachmentDto {
  @ApiPropertyOptional({ description: 'Inbound plan ID' })
  @IsOptional()
  @IsUUID()
  inbound_plan_id?: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @ApiPropertyOptional({ description: 'File name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'File path (legacy)' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ description: 'S3 bucket name' })
  @IsOptional()
  @IsString()
  s3_bucket?: string;

  @ApiPropertyOptional({ description: 'S3 object key' })
  @IsOptional()
  @IsString()
  s3_key?: string;

  @ApiPropertyOptional({ description: 'S3 URL' })
  @IsOptional()
  @IsString()
  s3_url?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  file_size?: number;

  @ApiPropertyOptional({ description: 'Content type' })
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiPropertyOptional({ description: 'ETag from S3' })
  @IsOptional()
  @IsString()
  etag?: string;

  @ApiPropertyOptional({ description: 'Is file public' })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
} 