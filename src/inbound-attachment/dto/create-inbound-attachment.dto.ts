import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInboundAttachmentDto {
  @ApiPropertyOptional({ description: 'Inbound plan ID' })
  @IsOptional()
  @IsUUID()
  inbound_plan_id?: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsOptional()
  @IsNumber()
  organization_id?: number;

  @ApiProperty({ description: 'File name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'File path (legacy)' })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiProperty({ description: 'S3 bucket name' })
  @IsString()
  s3_bucket: string;

  @ApiProperty({ description: 'S3 object key' })
  @IsString()
  s3_key: string;

  @ApiProperty({ description: 'S3 URL' })
  @IsString()
  s3_url: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  file_size: number;

  @ApiProperty({ description: 'Content type' })
  @IsString()
  content_type: string;

  @ApiProperty({ description: 'ETag from S3' })
  @IsString()
  etag: string;

  @ApiPropertyOptional({ description: 'Is file public', default: false })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
} 