import { Readable } from 'stream';

export const S3_SERVICE_TOKEN = 'S3_SERVICE';

export interface S3FileMetadata {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  url?: string;
}

export interface S3UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  cacheControl?: string;
  expires?: Date;
}

export interface S3DownloadOptions {
  responseContentType?: string;
  responseContentDisposition?: string;
  responseCacheControl?: string;
}

export interface S3ListOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface S3CopyOptions {
  sourceBucket?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
}

export interface S3PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface IS3Service {
  // Basic operations
  uploadFile(
    bucket: string,
    key: string,
    file: Buffer | Readable | string,
    options?: S3UploadOptions,
  ): Promise<S3FileMetadata>;

  downloadFile(bucket: string, key: string, options?: S3DownloadOptions): Promise<Buffer>;

  downloadFileAsStream(bucket: string, key: string, options?: S3DownloadOptions): Promise<Readable>;

  deleteFile(bucket: string, key: string): Promise<void>;

  // File management
  copyFile(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
    options?: S3CopyOptions,
  ): Promise<S3FileMetadata>;

  moveFile(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
    options?: S3CopyOptions,
  ): Promise<S3FileMetadata>;

  // File information
  getFileMetadata(bucket: string, key: string): Promise<S3FileMetadata>;

  fileExists(bucket: string, key: string): Promise<boolean>;

  // Listing and searching
  listFiles(
    bucket: string,
    options?: S3ListOptions,
  ): Promise<{
    files: S3FileMetadata[];
    nextContinuationToken?: string;
    isTruncated: boolean;
  }>;

  // URLs and presigned operations
  getFileUrl(bucket: string, key: string): string;

  generatePresignedUploadUrl(
    bucket: string,
    key: string,
    options?: S3PresignedUrlOptions,
  ): Promise<string>;

  generatePresignedDownloadUrl(
    bucket: string,
    key: string,
    options?: S3PresignedUrlOptions,
  ): Promise<string>;

  // Batch operations
  uploadMultipleFiles(
    bucket: string,
    files: Array<{
      key: string;
      file: Buffer | Readable | string;
      options?: S3UploadOptions;
    }>,
  ): Promise<S3FileMetadata[]>;

  deleteMultipleFiles(bucket: string, keys: string[]): Promise<void>;

  // Utility methods
  generateUniqueKey(prefix?: string, extension?: string): string;

  validateBucketName(bucket: string): boolean;

  validateKeyName(key: string): boolean;
}
