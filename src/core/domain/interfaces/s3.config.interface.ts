export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // For local development or custom endpoints
  forcePathStyle?: boolean; // For local development with MinIO
  maxRetries?: number;
  requestTimeout?: number;
  defaultBucket?: string;
  defaultAcl?:
    | 'private'
    | 'public-read'
    | 'public-read-write'
    | 'authenticated-read';
  defaultExpiresIn?: number; // seconds
  allowedFileTypes?: string[];
  maxFileSize?: number; // bytes
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

export interface S3ServiceConfig {
  config: S3Config;
  logger?: any; // NestJS Logger or custom logger
}
