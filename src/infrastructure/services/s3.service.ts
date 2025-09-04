import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type DeleteObjectCommandInput,
  type CopyObjectCommandInput,
  type HeadObjectCommandInput,
  type ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import {
  IS3Service,
  S3FileMetadata,
  S3UploadOptions,
  S3DownloadOptions,
  S3ListOptions,
  S3CopyOptions,
  S3PresignedUrlOptions,
} from '../../core/domain/interfaces/s3.service.interface';
import {
  S3Config,
  S3ServiceConfig,
} from '../../core/domain/interfaces/s3.config.interface';

@Injectable()
export class S3Service implements IS3Service {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);
  private readonly config: S3Config;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
    this.s3Client = this.createS3Client();
  }

  private loadConfig(): S3Config {
    const config: S3Config = {
      region:
        this.configService.get<string>('AWS_REGION') ||
        this.configService.get<string>('aws_region') ||
        'us-east-1',
      accessKeyId:
        this.configService.get<string>('AWS_ACCESS_KEY_ID') ||
        this.configService.get<string>('aws_access_key_id') ||
        '',
      secretAccessKey:
        this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
        this.configService.get<string>('aws_secret_access_key') ||
        this.configService.get<string>('secret_key') ||
        '',
      endpoint:
        this.configService.get<string>('AWS_S3_ENDPOINT') ||
        this.configService.get<string>('aws_s3_endpoint'),
      forcePathStyle:
        this.configService.get<boolean>('AWS_S3_FORCE_PATH_STYLE') ||
        this.configService.get<boolean>('aws_s3_force_path_style') ||
        false,
      maxRetries:
        this.configService.get<number>('AWS_S3_MAX_RETRIES') ||
        this.configService.get<number>('aws_s3_max_retries') ||
        3,
      requestTimeout:
        this.configService.get<number>('AWS_S3_REQUEST_TIMEOUT') ||
        this.configService.get<number>('aws_s3_request_timeout') ||
        30000,
      defaultBucket:
        this.configService.get<string>('AWS_S3_DEFAULT_BUCKET') ||
        this.configService.get<string>('aws_s3_default_bucket'),
      defaultAcl:
        this.configService.get<
          'private' | 'public-read' | 'public-read-write' | 'authenticated-read'
        >('AWS_S3_DEFAULT_ACL') ||
        this.configService.get<
          'private' | 'public-read' | 'public-read-write' | 'authenticated-read'
        >('aws_s3_default_acl') ||
        'private',
      defaultExpiresIn:
        this.configService.get<number>('AWS_S3_DEFAULT_EXPIRES_IN') ||
        this.configService.get<number>('aws_s3_default_expires_in') ||
        3600,
      allowedFileTypes: this.configService.get<string[]>(
        'AWS_S3_ALLOWED_FILE_TYPES',
      ) ||
        this.configService.get<string[]>('aws_s3_allowed_file_types') || ['*'],
      maxFileSize:
        this.configService.get<number>('AWS_S3_MAX_FILE_SIZE') ||
        this.configService.get<number>('aws_s3_max_file_size') ||
        100 * 1024 * 1024, // 100MB
      enableLogging:
        this.configService.get<boolean>('AWS_S3_ENABLE_LOGGING') ||
        this.configService.get<boolean>('aws_s3_enable_logging') ||
        true,
      enableMetrics:
        this.configService.get<boolean>('AWS_S3_ENABLE_METRICS') ||
        this.configService.get<boolean>('aws_s3_enable_metrics') ||
        false,
    };

    // Configuration can be overridden by extending the service or using environment variables

    return config;
  }

  private createS3Client(): S3Client {
    const clientConfig: any = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      maxAttempts: this.config.maxRetries,
      requestHandler: {
        httpOptions: {
          timeout: this.config.requestTimeout,
        },
      },
    };

    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
      clientConfig.forcePathStyle = this.config.forcePathStyle;
    }

    return new S3Client(clientConfig);
  }

  private log(
    level: 'log' | 'error' | 'warn' | 'debug',
    message: string,
    context?: any,
  ): void {
    if (this.config.enableLogging) {
      this.logger[level](message, context);
    }
  }

  private validateBucketNameInternal(bucket: string): void {
    if (!this.validateBucketName(bucket)) {
      throw new BadRequestException(`Invalid bucket name: ${bucket}`);
    }
  }

  private validateKeyNameInternal(key: string): void {
    if (!this.validateKeyName(key)) {
      throw new BadRequestException(`Invalid key name: ${key}`);
    }
  }

  private validateFileSize(size: number): void {
    if (this.config.maxFileSize && size > this.config.maxFileSize) {
      throw new BadRequestException(
        `File size ${size} exceeds maximum allowed size ${this.config.maxFileSize}`,
      );
    }
  }

  private validateFileType(contentType: string): void {
    if (
      this.config.allowedFileTypes &&
      this.config.allowedFileTypes.length > 0 &&
      !this.config.allowedFileTypes.includes('*')
    ) {
      const fileType = contentType.split('/')[0];
      if (
        !this.config.allowedFileTypes.some(
          (type) => type.includes(fileType) || type === contentType,
        )
      ) {
        throw new BadRequestException(
          `File type ${contentType} is not allowed`,
        );
      }
    }
  }

  async uploadFile(
    bucket: string,
    key: string,
    file: Buffer | Readable | string,
    options: S3UploadOptions = {},
  ): Promise<S3FileMetadata> {
    try {
      this.validateBucketNameInternal(bucket);
      this.validateKeyNameInternal(key);

      const fileBuffer = typeof file === 'string' ? Buffer.from(file) : file;
      const fileSize = Buffer.isBuffer(fileBuffer) ? fileBuffer.length : 0;

      if (fileSize > 0) {
        this.validateFileSize(fileSize);
      }

      const contentType = options.contentType || 'application/octet-stream';
      this.validateFileType(contentType);

      const uploadParams: PutObjectCommandInput = {
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: options.acl || this.config.defaultAcl,
        Metadata: options.metadata,
        CacheControl: options.cacheControl,
        Expires: options.expires,
      };

      this.log('debug', `Uploading file to S3: ${bucket}/${key}`, {
        size: fileSize,
        contentType,
      });

      const command = new PutObjectCommand(uploadParams);
      const result = await this.s3Client.send(command);

      const metadata: S3FileMetadata = {
        key,
        bucket,
        size: fileSize,
        contentType,
        lastModified: new Date(),
        etag: result.ETag?.replace(/"/g, '') || '',
        url: this.getFileUrl(bucket, key),
      };

      this.log('log', `File uploaded successfully: ${bucket}/${key}`, {
        etag: metadata.etag,
      });
      return metadata;
    } catch (error) {
      this.log('error', `Failed to upload file: ${bucket}/${key}`, error);
      throw error;
    }
  }

  async downloadFile(
    bucket: string,
    key: string,
    options: S3DownloadOptions = {},
  ): Promise<Buffer> {
    try {
      this.validateBucketNameInternal(bucket);
      this.validateKeyNameInternal(key);

      const downloadParams: GetObjectCommandInput = {
        Bucket: bucket,
        Key: key,
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
        ResponseCacheControl: options.responseCacheControl,
      };

      this.log('debug', `Downloading file from S3: ${bucket}/${key}`);

      const command = new GetObjectCommand(downloadParams);
      const result = await this.s3Client.send(command);

      if (!result.Body) {
        throw new NotFoundException(`File not found: ${bucket}/${key}`);
      }

      const chunks: Buffer[] = [];
      const stream = result.Body as Readable;

      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }

      const buffer = Buffer.concat(chunks);
      this.log('log', `File downloaded successfully: ${bucket}/${key}`, {
        size: buffer.length,
      });
      return buffer;
    } catch (error) {
      this.log('error', `Failed to download file: ${bucket}/${key}`, error);
      throw error;
    }
  }

  async downloadFileAsStream(
    bucket: string,
    key: string,
    options: S3DownloadOptions = {},
  ): Promise<Readable> {
    try {
      this.validateBucketNameInternal(bucket);
      this.validateKeyNameInternal(key);

      const downloadParams: GetObjectCommandInput = {
        Bucket: bucket,
        Key: key,
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
        ResponseCacheControl: options.responseCacheControl,
      };

      this.log('debug', `Downloading file as stream from S3: ${bucket}/${key}`);

      const command = new GetObjectCommand(downloadParams);
      const result = await this.s3Client.send(command);

      if (!result.Body) {
        throw new NotFoundException(`File not found: ${bucket}/${key}`);
      }

      return result.Body as Readable;
    } catch (error) {
      this.log(
        'error',
        `Failed to download file as stream: ${bucket}/${key}`,
        error,
      );
      throw error;
    }
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      this.validateBucketNameInternal(bucket);
      this.validateKeyNameInternal(key);

      const deleteParams: DeleteObjectCommandInput = {
        Bucket: bucket,
        Key: key,
      };

      this.log('debug', `Deleting file from S3: ${bucket}/${key}`);

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);

      this.log('log', `File deleted successfully: ${bucket}/${key}`);
    } catch (error) {
      this.log('error', `Failed to delete file: ${bucket}/${key}`, error);
      throw error;
    }
  }

  async copyFile(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
    options: S3CopyOptions = {},
  ): Promise<S3FileMetadata> {
    try {
      this.validateBucketNameInternal(sourceBucket);
      this.validateKeyNameInternal(sourceKey);
      this.validateBucketNameInternal(destinationBucket);
      this.validateKeyNameInternal(destinationKey);

      const copyParams: CopyObjectCommandInput = {
        Bucket: destinationBucket,
        Key: destinationKey,
        CopySource: `${sourceBucket}/${sourceKey}`,
        ACL: options.acl || this.config.defaultAcl,
        Metadata: options.metadata,
        MetadataDirective: options.metadata ? 'REPLACE' : 'COPY',
      };

      this.log(
        'debug',
        `Copying file in S3: ${sourceBucket}/${sourceKey} -> ${destinationBucket}/${destinationKey}`,
      );

      const command = new CopyObjectCommand(copyParams);
      const result = await this.s3Client.send(command);

      const metadata = await this.getFileMetadata(
        destinationBucket,
        destinationKey,
      );
      this.log(
        'log',
        `File copied successfully: ${sourceBucket}/${sourceKey} -> ${destinationBucket}/${destinationKey}`,
      );
      return metadata;
    } catch (error) {
      this.log(
        'error',
        `Failed to copy file: ${sourceBucket}/${sourceKey} -> ${destinationBucket}/${destinationKey}`,
        error,
      );
      throw error;
    }
  }

  async moveFile(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
    options: S3CopyOptions = {},
  ): Promise<S3FileMetadata> {
    try {
      const metadata = await this.copyFile(
        sourceBucket,
        sourceKey,
        destinationBucket,
        destinationKey,
        options,
      );
      await this.deleteFile(sourceBucket, sourceKey);
      this.log(
        'log',
        `File moved successfully: ${sourceBucket}/${sourceKey} -> ${destinationBucket}/${destinationKey}`,
      );
      return metadata;
    } catch (error) {
      this.log(
        'error',
        `Failed to move file: ${sourceBucket}/${sourceKey} -> ${destinationBucket}/${destinationKey}`,
        error,
      );
      throw error;
    }
  }

  async getFileMetadata(bucket: string, key: string): Promise<S3FileMetadata> {
    try {
      this.validateBucketNameInternal(bucket);
      this.validateKeyNameInternal(key);

      const headParams: HeadObjectCommandInput = {
        Bucket: bucket,
        Key: key,
      };

      this.log('debug', `Getting file metadata from S3: ${bucket}/${key}`);

      const command = new HeadObjectCommand(headParams);
      const result = await this.s3Client.send(command);

      const metadata: S3FileMetadata = {
        key,
        bucket,
        size: result.ContentLength || 0,
        contentType: result.ContentType || 'application/octet-stream',
        lastModified: result.LastModified || new Date(),
        etag: result.ETag?.replace(/"/g, '') || '',
        url: this.getFileUrl(bucket, key),
      };

      return metadata;
    } catch (error) {
      this.log('error', `Failed to get file metadata: ${bucket}/${key}`, error);
      throw error;
    }
  }

  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      await this.getFileMetadata(bucket, key);
      return true;
    } catch (error) {
      return false;
    }
  }

  async listFiles(
    bucket: string,
    options: S3ListOptions = {},
  ): Promise<{
    files: S3FileMetadata[];
    nextContinuationToken?: string;
    isTruncated: boolean;
  }> {
    try {
      this.validateBucketNameInternal(bucket);

      const listParams: ListObjectsV2CommandInput = {
        Bucket: bucket,
        Prefix: options.prefix,
        Delimiter: options.delimiter,
        MaxKeys: options.maxKeys || 1000,
        ContinuationToken: options.continuationToken,
      };

      this.log('debug', `Listing files from S3: ${bucket}`, {
        prefix: options.prefix,
      });

      const command = new ListObjectsV2Command(listParams);
      const result = await this.s3Client.send(command);

      const files: S3FileMetadata[] = (result.Contents || []).map((item) => ({
        key: item.Key || '',
        bucket,
        size: item.Size || 0,
        contentType: 'application/octet-stream', // S3 doesn't return content type in list
        lastModified: item.LastModified || new Date(),
        etag: item.ETag?.replace(/"/g, '') || '',
        url: this.getFileUrl(bucket, item.Key || ''),
      }));

      this.log('log', `Listed ${files.length} files from S3: ${bucket}`);
      return {
        files,
        nextContinuationToken: result.NextContinuationToken,
        isTruncated: result.IsTruncated || false,
      };
    } catch (error) {
      this.log('error', `Failed to list files from S3: ${bucket}`, error);
      throw error;
    }
  }

  getFileUrl(bucket: string, key: string): string {
    if (this.config.endpoint) {
      // Custom endpoint (e.g., MinIO)
      return `${this.config.endpoint}/${bucket}/${key}`;
    }
    // AWS S3 standard URL
    return `https://${bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  async generatePresignedUploadUrl(
    bucket: string,
    key: string,
    options: S3PresignedUrlOptions = {},
  ): Promise<string> {
    try {
      this.validateBucketNameInternal(bucket);
      this.validateKeyNameInternal(key);

      const expiresIn =
        options.expiresIn || this.config.defaultExpiresIn || 3600;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: options.contentType,
      });

      this.log('debug', `Generating presigned upload URL: ${bucket}/${key}`);

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.log('log', `Generated presigned upload URL: ${bucket}/${key}`);
      return url;
    } catch (error) {
      this.log(
        'error',
        `Failed to generate presigned upload URL: ${bucket}/${key}`,
        error,
      );
      throw error;
    }
  }

  async generatePresignedDownloadUrl(
    bucket: string,
    key: string,
    options: S3PresignedUrlOptions = {},
  ): Promise<string> {
    try {
      this.validateBucketNameInternal(bucket);
      this.validateKeyNameInternal(key);

      const expiresIn =
        options.expiresIn || this.config.defaultExpiresIn || 3600;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentType: options.responseContentType,
        ResponseContentDisposition: options.responseContentDisposition,
      });

      this.log('debug', `Generating presigned download URL: ${bucket}/${key}`);

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.log('log', `Generated presigned download URL: ${bucket}/${key}`);
      return url;
    } catch (error) {
      this.log(
        'error',
        `Failed to generate presigned download URL: ${bucket}/${key}`,
        error,
      );
      throw error;
    }
  }

  async uploadMultipleFiles(
    bucket: string,
    files: Array<{
      key: string;
      file: Buffer | Readable | string;
      options?: S3UploadOptions;
    }>,
  ): Promise<S3FileMetadata[]> {
    try {
      this.validateBucketNameInternal(bucket);

      this.log('debug', `Uploading ${files.length} files to S3: ${bucket}`);

      const uploadPromises = files.map(async ({ key, file, options }) => {
        return this.uploadFile(bucket, key, file, options);
      });

      const results = await Promise.all(uploadPromises);
      this.log(
        'log',
        `Successfully uploaded ${results.length} files to S3: ${bucket}`,
      );
      return results;
    } catch (error) {
      this.log(
        'error',
        `Failed to upload multiple files to S3: ${bucket}`,
        error,
      );
      throw error;
    }
  }

  async deleteMultipleFiles(bucket: string, keys: string[]): Promise<void> {
    try {
      this.validateBucketNameInternal(bucket);

      this.log('debug', `Deleting ${keys.length} files from S3: ${bucket}`);

      const deletePromises = keys.map(async (key) => {
        return this.deleteFile(bucket, key);
      });

      await Promise.all(deletePromises);
      this.log(
        'log',
        `Successfully deleted ${keys.length} files from S3: ${bucket}`,
      );
    } catch (error) {
      this.log(
        'error',
        `Failed to delete multiple files from S3: ${bucket}`,
        error,
      );
      throw error;
    }
  }

  generateUniqueKey(prefix?: string, extension?: string): string {
    const uuid = uuidv4();
    const timestamp = Date.now();
    const key = `${prefix || 'uploads'}/${timestamp}-${uuid}${extension ? `.${extension}` : ''}`;
    return key;
  }

  validateBucketName(bucket: string): boolean {
    // S3 bucket naming rules
    const bucketRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
    return (
      bucketRegex.test(bucket) && bucket.length >= 3 && bucket.length <= 63
    );
  }

  validateKeyName(key: string): boolean {
    // S3 key naming rules
    return key.length > 0 && key.length <= 1024 && !key.startsWith('/');
  }
}
