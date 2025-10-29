import {
  Injectable,
  Logger,
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import {
  IS3Service,
  S3_SERVICE_TOKEN,
  S3FileMetadata,
  S3UploadOptions,
} from '../../core/domain/interfaces/s3.service.interface';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

// Type definition for Express.Multer.File
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  generateUniqueNames: boolean;
  defaultBucket: string;
  uploadPath: string;
}

export interface FileUploadResult {
  success: boolean;
  files: S3FileMetadata[];
  errors?: string[];
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly config: FileUploadConfig;

  constructor(
    private readonly configService: ConfigService,
    @Inject(S3_SERVICE_TOKEN)
    private readonly s3Service: IS3Service,
  ) {
    this.config = this.loadConfig();
  }

  private loadConfig(): FileUploadConfig {
    return {
      maxFileSize: this.configService.get<number>('FILE_UPLOAD_MAX_SIZE') || 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: this.configService.get<string[]>('FILE_UPLOAD_ALLOWED_MIME_TYPES') || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      allowedExtensions: this.configService.get<string[]>('FILE_UPLOAD_ALLOWED_EXTENSIONS') || [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.pdf',
        '.txt',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
      ],
      generateUniqueNames:
        this.configService.get<boolean>('FILE_UPLOAD_GENERATE_UNIQUE_NAMES') || true,
      defaultBucket: this.configService.get<string>('AWS_S3_DEFAULT_BUCKET') || 'wms-uploads',
      uploadPath: this.configService.get<string>('FILE_UPLOAD_PATH') || 'uploads',
    };
  }

  /**
   * Validate a single file
   */
  validateFile(file: MulterFile): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Detect proper content type
    const detectedContentType = this.detectContentType(file);

    // Check file size
    if (file.size > this.config.maxFileSize) {
      errors.push(`File size ${file.size} exceeds maximum allowed size ${this.config.maxFileSize}`);
    }

    // Check MIME type using detected content type
    if (
      this.config.allowedMimeTypes.length > 0 &&
      !this.config.allowedMimeTypes.includes(detectedContentType)
    ) {
      errors.push(
        `File type ${detectedContentType} is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`,
      );
    }

    // Check file extension
    const extension = extname(file.originalname).toLowerCase();
    if (
      this.config.allowedExtensions.length > 0 &&
      !this.config.allowedExtensions.includes(extension)
    ) {
      errors.push(
        `File extension ${extension} is not allowed. Allowed extensions: ${this.config.allowedExtensions.join(', ')}`,
      );
    }

    // Check if MIME type matches extension
    if (!this.validateMimeTypeExtension(detectedContentType, extension)) {
      warnings.push(`File extension ${extension} may not match MIME type ${detectedContentType}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate multiple files
   */
  validateFiles(files: MulterFile[]): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!files || files.length === 0) {
      errors.push('No files provided');
      return { isValid: false, errors, warnings };
    }

    files.forEach((file, index) => {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          errors.push(`File ${index + 1} (${file.originalname}): ${error}`);
        });
      }
      validation.warnings.forEach((warning) => {
        warnings.push(`File ${index + 1} (${file.originalname}): ${warning}`);
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate a unique file key
   */
  generateFileKey(
    originalName: string,
    prefix?: string,
    preserveExtension: boolean = true,
  ): string {
    const extension = preserveExtension ? extname(originalName) : '';
    const baseName = originalName.replace(extname(originalName), '');

    if (this.config.generateUniqueNames) {
      const uuid = uuidv4();
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFileName(baseName);
      return `${this.config.uploadPath}/${prefix || 'files'}/${timestamp}-${uuid}-${sanitizedName}${extension}`;
    }

    const sanitizedName = this.sanitizeFileName(baseName);
    return `${this.config.uploadPath}/${prefix || 'files'}/${sanitizedName}${extension}`;
  }

  /**
   * Upload a single file to S3
   */
  async uploadSingleFile(
    file: MulterFile,
    options: {
      bucket?: string;
      key?: string;
      prefix?: string;
      preserveOriginalName?: boolean;
      s3Options?: S3UploadOptions;
    } = {},
  ): Promise<S3FileMetadata> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new BadRequestException(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate file key
    const key =
      options.key ||
      this.generateFileKey(
        file.originalname,
        options.prefix,
        options.preserveOriginalName !== false,
      );

    // Use provided bucket or default
    const bucket = options.bucket || this.config.defaultBucket;

    // Prepare S3 upload options
    const s3Options: S3UploadOptions = {
      contentType: options.s3Options?.contentType || this.detectContentType(file),
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size.toString(),
        detectedContentType: this.detectContentType(file),
        ...options.s3Options?.metadata,
      },
      ...options.s3Options,
    };

    this.logger.log(`Uploading file: ${file.originalname} to ${bucket}/${key}`);

    try {
      const result = await this.s3Service.uploadFile(bucket, key, file.buffer, s3Options);

      this.logger.log(`File uploaded successfully: ${bucket}/${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${file.originalname}`, error);
      throw error;
    }
  }

  /**
   * Upload multiple files to S3
   */
  async uploadMultipleFiles(
    files: MulterFile[],
    options: {
      bucket?: string;
      prefix?: string;
      preserveOriginalNames?: boolean;
      s3Options?: S3UploadOptions;
      continueOnError?: boolean;
    } = {},
  ): Promise<FileUploadResult> {
    const result: FileUploadResult = {
      success: true,
      files: [],
      errors: [],
      totalFiles: files.length,
      successfulUploads: 0,
      failedUploads: 0,
    };

    // Validate all files first
    const validation = this.validateFiles(files);
    if (!validation.isValid) {
      result.success = false;
      result.errors = validation.errors;
      if (!options.continueOnError) {
        throw new BadRequestException(`File validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      this.logger.warn(`File validation warnings: ${validation.warnings.join(', ')}`);
    }

    // Upload files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploadResult = await this.uploadSingleFile(file, {
          bucket: options.bucket,
          prefix: options.prefix,
          preserveOriginalName: options.preserveOriginalNames,
          s3Options: options.s3Options,
        });

        result.files.push(uploadResult);
        result.successfulUploads++;
      } catch (error) {
        result.failedUploads++;
        const errorMessage = `Failed to upload file ${i + 1} (${file.originalname}): ${error.message}`;
        result.errors = result.errors || [];
        result.errors.push(errorMessage);
        this.logger.error(errorMessage, error);

        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    // Update overall success status
    if (result.failedUploads > 0) {
      result.success = result.successfulUploads > 0; // Partial success if some files uploaded
    }

    this.logger.log(
      `Upload completed: ${result.successfulUploads}/${result.totalFiles} files uploaded successfully`,
    );

    return result;
  }

  /**
   * Upload file with custom validation rules
   */
  async uploadFileWithCustomValidation(
    file: MulterFile,
    customValidation: (file: MulterFile) => FileValidationResult,
    options: {
      bucket?: string;
      key?: string;
      prefix?: string;
      preserveOriginalName?: boolean;
      s3Options?: S3UploadOptions;
    } = {},
  ): Promise<S3FileMetadata> {
    // Use custom validation
    const validation = customValidation(file);
    if (!validation.isValid) {
      throw new BadRequestException(`Custom validation failed: ${validation.errors.join(', ')}`);
    }

    return this.uploadSingleFile(file, options);
  }

  /**
   * Get file upload configuration
   */
  getConfig(): FileUploadConfig {
    return { ...this.config };
  }

  /**
   * Update file upload configuration
   */
  updateConfig(newConfig: Partial<FileUploadConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.log('File upload configuration updated', newConfig);
  }

  /**
   * Sanitize file name for S3 key
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Detect and fix content type based on file extension and MIME type
   */
  private detectContentType(file: MulterFile): string {
    let contentType = file.mimetype;

    // If MIME type is missing or incorrect, detect from file extension
    if (
      !contentType ||
      contentType === 'application/octet-stream' ||
      contentType === 'binary/octet-stream'
    ) {
      const extension = extname(file.originalname).toLowerCase();

      switch (extension) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.txt':
          contentType = 'text/plain';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.xls':
          contentType = 'application/vnd.ms-excel';
          break;
        case '.xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        default:
          contentType = 'application/octet-stream';
      }
    }

    // Fix common content type issues
    if (contentType === 'pdf' || contentType === 'PDF') {
      contentType = 'application/pdf';
    } else if (contentType === 'jpg' || contentType === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (contentType === 'png') {
      contentType = 'image/png';
    } else if (contentType === 'gif') {
      contentType = 'image/gif';
    } else if (contentType === 'txt') {
      contentType = 'text/plain';
    } else if (contentType === 'doc') {
      contentType = 'application/msword';
    } else if (contentType === 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (contentType === 'xls') {
      contentType = 'application/vnd.ms-excel';
    } else if (contentType === 'xlsx') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return contentType;
  }

  /**
   * Validate if MIME type matches file extension
   */
  private validateMimeTypeExtension(mimeType: string, extension: string): boolean {
    const mimeTypeMap: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    };

    const expectedExtensions = mimeTypeMap[mimeType];
    return expectedExtensions ? expectedExtensions.includes(extension.toLowerCase()) : true;
  }
}
