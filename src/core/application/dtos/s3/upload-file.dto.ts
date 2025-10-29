import {
  IsString,
  IsOptional,
  IsObject,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class S3UploadOptionsDto {
  @ApiPropertyOptional({ description: 'Content type of the file' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the file' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Access control level',
    enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
  })
  @IsOptional()
  @IsEnum(['private', 'public-read', 'public-read-write', 'authenticated-read'])
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';

  @ApiPropertyOptional({ description: 'Cache control header' })
  @IsOptional()
  @IsString()
  cacheControl?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expires?: string;
}

export class UploadFileDto {
  @ApiProperty({ description: 'S3 bucket name' })
  @IsString()
  bucket: string;

  @ApiProperty({ description: 'File key (path) in S3' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ description: 'Content type of the file' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({
    description: 'Access control level',
    enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
  })
  @IsOptional()
  @IsEnum(['private', 'public-read', 'public-read-write', 'authenticated-read'])
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';

  @ApiPropertyOptional({ description: 'Upload options' })
  @IsOptional()
  options?: S3UploadOptionsDto;
}

export class UploadMultipleFilesDto {
  @ApiProperty({ description: 'S3 bucket name' })
  @IsString()
  bucket: string;

  @ApiProperty({
    description: 'Array of files to upload',
    type: [Object],
  })
  files: Array<{
    key: string;
    options?: S3UploadOptionsDto;
  }>;
}

export class DownloadFileDto {
  @ApiProperty({ description: 'S3 bucket name' })
  @IsString()
  bucket: string;

  @ApiProperty({ description: 'File key (path) in S3' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ description: 'Download options' })
  @IsOptional()
  options?: {
    responseContentType?: string;
    responseContentDisposition?: string;
    responseCacheControl?: string;
  };
}

export class DeleteFileDto {
  @ApiProperty({ description: 'S3 bucket name' })
  @IsString()
  bucket: string;

  @ApiProperty({ description: 'File key (path) in S3' })
  @IsString()
  key: string;
}

export class CopyFileDto {
  @ApiProperty({ description: 'Source bucket name' })
  @IsString()
  sourceBucket: string;

  @ApiProperty({ description: 'Source file key' })
  @IsString()
  sourceKey: string;

  @ApiProperty({ description: 'Destination bucket name' })
  @IsString()
  destinationBucket: string;

  @ApiProperty({ description: 'Destination file key' })
  @IsString()
  destinationKey: string;

  @ApiPropertyOptional({ description: 'Copy options' })
  @IsOptional()
  options?: {
    metadata?: Record<string, string>;
    acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  };
}

export class ListFilesDto {
  @ApiProperty({ description: 'S3 bucket name' })
  @IsString()
  bucket: string;

  @ApiPropertyOptional({ description: 'File prefix to filter by' })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ description: 'Delimiter for listing' })
  @IsOptional()
  @IsString()
  delimiter?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of keys to return',
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxKeys?: number;

  @ApiPropertyOptional({ description: 'Continuation token for pagination' })
  @IsOptional()
  @IsString()
  continuationToken?: string;
}

export class PresignedUrlDto {
  @ApiProperty({ description: 'S3 bucket name' })
  @IsString()
  bucket: string;

  @ApiProperty({ description: 'File key (path) in S3' })
  @IsString()
  key: string;

  @ApiPropertyOptional({
    description: 'Expiration time in seconds',
    minimum: 1,
    maximum: 604800,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(604800)
  expiresIn?: number;

  @ApiPropertyOptional({ description: 'Content type for upload' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Response content type for download' })
  @IsOptional()
  @IsString()
  responseContentType?: string;

  @ApiPropertyOptional({
    description: 'Response content disposition for download',
  })
  @IsOptional()
  @IsString()
  responseContentDisposition?: string;
}

// ===== ENHANCED FLEXIBLE UPLOAD DTOs =====

export class FlexibleUploadDto {
  @ApiPropertyOptional({ description: 'S3 bucket name' })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional({ description: 'File key (path) in S3' })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({ description: 'File prefix for auto-generated keys' })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ description: 'Whether to preserve original file name' })
  @IsOptional()
  preserveOriginalName?: boolean;

  @ApiPropertyOptional({ description: 'Content type of the file' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({
    description: 'Access control level',
    enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
  })
  @IsOptional()
  @IsEnum(['private', 'public-read', 'public-read-write', 'authenticated-read'])
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';

  @ApiPropertyOptional({ description: 'Additional metadata for the file' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Cache control header' })
  @IsOptional()
  @IsString()
  cacheControl?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expires?: string;
}

export class BatchUploadDto {
  @ApiPropertyOptional({ description: 'S3 bucket name' })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional({ description: 'File prefix for auto-generated keys' })
  @IsOptional()
  @IsString()
  prefix?: string;

  @ApiPropertyOptional({ description: 'Whether to preserve original file names' })
  @IsOptional()
  preserveOriginalNames?: boolean;

  @ApiPropertyOptional({ description: 'Whether to continue uploading if some files fail' })
  @IsOptional()
  continueOnError?: boolean;

  @ApiPropertyOptional({ description: 'Content type for all files' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({
    description: 'Access control level for all files',
    enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
  })
  @IsOptional()
  @IsEnum(['private', 'public-read', 'public-read-write', 'authenticated-read'])
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';

  @ApiPropertyOptional({ description: 'Additional metadata for all files' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}

export class FileValidationConfigDto {
  @ApiPropertyOptional({ description: 'Maximum file size in bytes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxFileSize?: number;

  @ApiPropertyOptional({ description: 'Allowed MIME types' })
  @IsOptional()
  allowedMimeTypes?: string[];

  @ApiPropertyOptional({ description: 'Allowed file extensions' })
  @IsOptional()
  allowedExtensions?: string[];

  @ApiPropertyOptional({ description: 'Whether to generate unique file names' })
  @IsOptional()
  generateUniqueNames?: boolean;

  @ApiPropertyOptional({ description: 'Default S3 bucket' })
  @IsOptional()
  @IsString()
  defaultBucket?: string;

  @ApiPropertyOptional({ description: 'Default upload path' })
  @IsOptional()
  @IsString()
  uploadPath?: string;
}
