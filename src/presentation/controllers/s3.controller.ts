import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
  Header,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import {
  IS3Service,
  S3_SERVICE_TOKEN,
} from '../../core/domain/interfaces/s3.service.interface';
import { FileUploadService } from '../../infrastructure/services/file-upload.service';
import {
  UploadFileDto,
  DownloadFileDto,
  CopyFileDto,
  ListFilesDto,
  PresignedUrlDto,
  FlexibleUploadDto,
  BatchUploadDto,
} from '../../core/application/dtos/s3/upload-file.dto';

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

@ApiTags('S3 File Management')
@Controller('s3')
@ApiBearerAuth('JWT-auth')
export class S3Controller {
  private readonly logger = new Logger(S3Controller.name);

  constructor(
    @Inject(S3_SERVICE_TOKEN)
    private readonly s3Service: IS3Service,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post('upload')
  @ApiOperation({ 
    summary: 'Upload a single file to S3 with automatic content type detection',
    description: 'Upload a file to S3. Content type is automatically detected from the file extension and MIME type.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', example: 'my-bucket' },
        key: { type: 'string', example: 'uploads/document.pdf' },
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload. Content type will be automatically detected.',
        },
        acl: {
          type: 'string',
          enum: [
            'private',
            'public-read',
            'public-read-write',
            'authenticated-read',
          ],
          example: 'private',
          description: 'Access control level for the uploaded file',
        },
      },
      required: ['bucket', 'key', 'file'],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Operation successful' },
        data: {
          type: 'object',
          properties: {
            key: { type: 'string', example: 'uploads/file.txt' },
            bucket: { type: 'string', example: 'my-bucket' },
            size: { type: 'number', example: 64899 },
            contentType: { type: 'string', example: 'text/plain' },
            lastModified: { type: 'string', format: 'date-time' },
            etag: { type: 'string', example: '24a03a5a14c8383c03b8e65e19bfbabf' },
            url: { type: 'string', example: 'https://bucket.s3.region.amazonaws.com/key' }
          }
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/s3/upload' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body() uploadDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Automatically detect content type from uploaded file
    const detectedContentType = this.detectContentType(file);
    
    // Log the detection for debugging
    this.logger.log(`File upload detected: ${file.originalname} -> ${detectedContentType}`);

    const metadata = await this.s3Service.uploadFile(
      uploadDto.bucket,
      uploadDto.key,
      file.buffer,
      {
        contentType: detectedContentType, // Use automatically detected content type
        acl: uploadDto.acl || (detectedContentType === 'application/pdf' ? 'public-read' : 'private'), // PDFs are public-readable
        metadata: {
          ...uploadDto.options?.metadata,
          originalMimeType: file.mimetype,
          detectedContentType,
          fileName: file.originalname,
        },
        cacheControl: uploadDto.options?.cacheControl,
        expires: uploadDto.options?.expires
          ? new Date(uploadDto.options.expires)
          : undefined,
      },
    );

    return metadata;
  }

  @Get('download/:bucket/*path')
  @ApiOperation({ summary: 'Download a file from S3' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @Header('Content-Type', 'application/octet-stream')
  async downloadFile(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
    @Res() res: Response,
    @Query() downloadDto: DownloadFileDto,
  ) {
    try {
      // Get file metadata first to determine content type
      const metadata = await this.s3Service.getFileMetadata(bucket, key);
      
      // Set proper headers
      res.setHeader('Content-Type', metadata.contentType);
      res.setHeader('Content-Length', metadata.size);
      res.setHeader('Content-Disposition', `inline; filename="${metadata.key.split('/').pop()}"`);
      
      // Stream the file directly to response
      const fileStream = await this.s3Service.downloadFileAsStream(bucket, key, {
        responseContentType: downloadDto.options?.responseContentType,
        responseContentDisposition: downloadDto.options?.responseContentDisposition,
        responseCacheControl: downloadDto.options?.responseCacheControl,
      });

      fileStream.pipe(res);
    } catch (error) {
      this.logger.error(`Failed to download file: ${bucket}/${key}`, error);
      res.status(404).json({
        success: false,
        message: 'File not found',
        error: error.message,
      });
    }
  }

  @Get('view/:bucket/*path')
  @ApiOperation({ 
    summary: 'View a file in browser (especially PDFs)',
    description: 'Streams file content directly to browser for viewing. Perfect for PDFs, images, etc.'
  })
  @ApiResponse({ status: 200, description: 'File displayed successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async viewFile(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
    @Res() res: Response,
  ) {
    try {
      // Get file metadata first to determine content type
      const metadata = await this.s3Service.getFileMetadata(bucket, key);
      
      // Set proper headers for browser viewing
      res.setHeader('Content-Type', metadata.contentType);
      res.setHeader('Content-Length', metadata.size);
      res.setHeader('Content-Disposition', `inline; filename="${metadata.key.split('/').pop()}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Stream the file directly to response
      const fileStream = await this.s3Service.downloadFileAsStream(bucket, key);
      fileStream.pipe(res);
      
      this.logger.log(`File viewed: ${bucket}/${key} (${metadata.contentType})`);
    } catch (error) {
      this.logger.error(`Failed to view file: ${bucket}/${key}`, error);
      res.status(404).json({
        success: false,
        message: 'File not found',
        error: error.message,
      });
    }
  }

  @Get('presigned-url/:bucket/*path')
  @ApiOperation({ 
    summary: 'Generate presigned URL for private file access',
    description: 'Generates a temporary presigned URL for accessing private files'
  })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async generatePresignedUrl(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    try {
      // Check if file exists
      const exists = await this.s3Service.fileExists(bucket, key);
      if (!exists) {
        throw new NotFoundException(`File not found: ${bucket}/${key}`);
      }

      const expires = expiresIn ? parseInt(expiresIn) : 3600; // Default 1 hour
      const url = await this.s3Service.generatePresignedDownloadUrl(bucket, key, {
        expiresIn: expires,
      });

      return {
        url,
        expiresIn: expires,
        expiresAt: new Date(Date.now() + expires * 1000).toISOString(),
        bucket,
        key,
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${bucket}/${key}`, error);
      throw error;
    }
  }

  @Get('metadata/:bucket/*path')
  @ApiOperation({ summary: 'Get file metadata from S3' })
  @ApiResponse({
    status: 200,
    description: 'File metadata retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileMetadata(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
  ) {
    const metadata = await this.s3Service.getFileMetadata(bucket, key);

    return metadata;
  }

  @Get('exists/:bucket/*path')
  @ApiOperation({ summary: 'Check if file exists in S3' })
  @ApiResponse({
    status: 200,
    description: 'File existence checked successfully',
  })
  async fileExists(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
  ) {
    const exists = await this.s3Service.fileExists(bucket, key);

    return { exists };
  }

  @Get('list/:bucket')
  @ApiOperation({ summary: 'List files in S3 bucket' })
  @ApiResponse({ status: 200, description: 'Files listed successfully' })
  async listFiles(
    @Param('bucket') bucket: string,
    @Query() listDto: ListFilesDto,
  ) {
    const result = await this.s3Service.listFiles(bucket, {
      prefix: listDto.prefix,
      delimiter: listDto.delimiter,
      maxKeys: listDto.maxKeys,
      continuationToken: listDto.continuationToken,
    });

    return result;
  }

  @Put('copy')
  @ApiOperation({ summary: 'Copy a file in S3' })
  @ApiResponse({ status: 200, description: 'File copied successfully' })
  @ApiResponse({ status: 404, description: 'Source file not found' })
  async copyFile(@Body() copyDto: CopyFileDto) {
    const metadata = await this.s3Service.copyFile(
      copyDto.sourceBucket,
      copyDto.sourceKey,
      copyDto.destinationBucket,
      copyDto.destinationKey,
      {
        metadata: copyDto.options?.metadata,
        acl: copyDto.options?.acl,
      },
    );

    return metadata;
  }

  @Delete(':bucket/*path')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file from S3' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
  ) {
    await this.s3Service.deleteFile(bucket, key);

    return { message: 'File deleted successfully' };
  }

  @Post('presigned-upload-url')
  @ApiOperation({ summary: 'Generate presigned upload URL' })
  @ApiResponse({
    status: 200,
    description: 'Presigned upload URL generated successfully',
  })
  async generatePresignedUploadUrl(@Body() presignedDto: PresignedUrlDto) {
    const url = await this.s3Service.generatePresignedUploadUrl(
      presignedDto.bucket,
      presignedDto.key,
      {
        expiresIn: presignedDto.expiresIn,
        contentType: presignedDto.contentType,
      },
    );

    return { url };
  }

  @Post('presigned-download-url')
  @ApiOperation({ summary: 'Generate presigned download URL' })
  @ApiResponse({
    status: 200,
    description: 'Presigned download URL generated successfully',
  })
  async generatePresignedDownloadUrl(@Body() presignedDto: PresignedUrlDto) {
    const url = await this.s3Service.generatePresignedDownloadUrl(
      presignedDto.bucket,
      presignedDto.key,
      {
        expiresIn: presignedDto.expiresIn,
        responseContentType: presignedDto.responseContentType,
        responseContentDisposition: presignedDto.responseContentDisposition,
      },
    );

    return { url };
  }

  @Get('url/:bucket/*path')
  @ApiOperation({ summary: 'Get public URL for a file' })
  @ApiResponse({ status: 200, description: 'File URL retrieved successfully' })
  async getFileUrl(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
  ) {
    const url = this.s3Service.getFileUrl(bucket, key);

    return { url };
  }

  @Post('generate-key')
  @ApiOperation({ summary: 'Generate a unique file key' })
  @ApiResponse({
    status: 200,
    description: 'Unique key generated successfully',
  })
  async generateUniqueKey(
    @Body() body: { prefix?: string; extension?: string },
  ) {
    const key = this.s3Service.generateUniqueKey(body.prefix, body.extension);

    return { key };
  }

  // ===== ENHANCED FLEXIBLE UPLOAD ENDPOINTS =====

  @Post('upload/flexible')
  @ApiOperation({ 
    summary: 'Flexible single file upload with automatic content type detection',
    description: 'Upload a single file with flexible configuration options. Content type is automatically detected from the file.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload. Content type will be automatically detected.',
        },
        bucket: { type: 'string', example: 'my-bucket' },
        key: { type: 'string', example: 'uploads/document.pdf' },
        prefix: { type: 'string', example: 'documents' },
        preserveOriginalName: { type: 'boolean', example: true },
        acl: {
          type: 'string',
          enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
          example: 'private',
        },
        metadata: { type: 'object', example: { category: 'document', author: 'user123' } },
        cacheControl: { type: 'string', example: 'max-age=3600' },
        expires: { type: 'string', format: 'date-time' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @UseInterceptors(FileInterceptor('file'))
  async flexibleUpload(
    @UploadedFile() file: MulterFile,
    @Body() uploadDto: FlexibleUploadDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Automatically detect content type from uploaded file
    const detectedContentType = this.detectContentType(file);
    
    // Log the detection for debugging
    this.logger.log(`Flexible upload detected: ${file.originalname} -> ${detectedContentType}`);

    const result = await this.fileUploadService.uploadSingleFile(file, {
      bucket: uploadDto.bucket,
      key: uploadDto.key,
      prefix: uploadDto.prefix,
      preserveOriginalName: uploadDto.preserveOriginalName,
      s3Options: {
        contentType: detectedContentType, // Use automatically detected content type
        acl: uploadDto.acl,
        metadata: {
          ...uploadDto.metadata,
          originalMimeType: file.mimetype,
          detectedContentType,
          fileName: file.originalname,
        },
        cacheControl: uploadDto.cacheControl,
        expires: uploadDto.expires ? new Date(uploadDto.expires) : undefined,
      },
    });

    return result;
  }

  @Post('upload/batch')
  @ApiOperation({ 
    summary: 'Batch upload multiple files with flexible options',
    description: 'Upload multiple files with flexible configuration options, validation, and error handling'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        bucket: { type: 'string', example: 'my-bucket' },
        prefix: { type: 'string', example: 'documents' },
        preserveOriginalNames: { type: 'boolean', example: true },
        continueOnError: { type: 'boolean', example: true },
        contentType: { type: 'string', example: 'text/plain' },
        acl: {
          type: 'string',
          enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
          example: 'private',
        },
        metadata: { type: 'object', example: { category: 'documents', batch: 'batch-001' } },
      },
      required: ['files'],
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Maximum 10 files
  async batchUpload(
    @UploadedFiles() files: MulterFile[],
    @Body() uploadDto: BatchUploadDto,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Log file detection for debugging
    files.forEach(file => {
      const detectedContentType = this.detectContentType(file);
      this.logger.log(`Batch upload detected: ${file.originalname} -> ${detectedContentType}`);
    });

    const result = await this.fileUploadService.uploadMultipleFiles(files, {
      bucket: uploadDto.bucket,
      prefix: uploadDto.prefix,
      preserveOriginalNames: uploadDto.preserveOriginalNames,
      continueOnError: uploadDto.continueOnError,
      s3Options: {
        // Content type will be automatically detected for each file
        acl: uploadDto.acl,
        metadata: uploadDto.metadata,
      },
    });

    return result;
  }

  @Post('upload/validate')
  @ApiOperation({ 
    summary: 'Validate files before upload',
    description: 'Validate files against configured rules without uploading them'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({ status: 200, description: 'Files validated successfully' })
  @ApiResponse({ status: 400, description: 'File validation failed' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async validateFiles(
    @UploadedFiles() files: MulterFile[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const validation = this.fileUploadService.validateFiles(files);
    const config = this.fileUploadService.getConfig();

    return {
      validation,
      config: {
        maxFileSize: config.maxFileSize,
        allowedMimeTypes: config.allowedMimeTypes,
        allowedExtensions: config.allowedExtensions,
      },
    };
  }

  @Get('upload/config')
  @ApiOperation({ summary: 'Get file upload configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getUploadConfig() {
    const config = this.fileUploadService.getConfig();

    return config;
  }

  @Put('upload/config')
  @ApiOperation({ summary: 'Update file upload configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateUploadConfig(
    @Body() configUpdate: Partial<{
      maxFileSize: number;
      allowedMimeTypes: string[];
      allowedExtensions: string[];
      generateUniqueNames: boolean;
      defaultBucket: string;
      uploadPath: string;
    }>,
  ) {
    this.fileUploadService.updateConfig(configUpdate);

    return this.fileUploadService.getConfig();
  }

  @Post('upload/custom-validation')
  @ApiOperation({ 
    summary: 'Upload file with custom validation',
    description: 'Upload a file with custom validation rules (for advanced use cases)'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        bucket: { type: 'string', example: 'my-bucket' },
        key: { type: 'string', example: 'uploads/file.txt' },
        prefix: { type: 'string', example: 'documents' },
        preserveOriginalName: { type: 'boolean', example: true },
        customValidationRules: {
          type: 'object',
          properties: {
            maxFileSize: { type: 'number' },
            allowedMimeTypes: { type: 'array', items: { type: 'string' } },
            allowedExtensions: { type: 'array', items: { type: 'string' } },
          },
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Custom validation failed' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadWithCustomValidation(
    @UploadedFile() file: MulterFile,
    @Body() uploadDto: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Create custom validation function
    const customValidation = (file: MulterFile) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Apply custom validation rules
      if (uploadDto.customValidationRules?.maxFileSize && 
          file.size > uploadDto.customValidationRules.maxFileSize) {
        errors.push(`File size exceeds custom limit of ${uploadDto.customValidationRules.maxFileSize}`);
      }

      if (uploadDto.customValidationRules?.allowedMimeTypes?.length > 0 &&
          !uploadDto.customValidationRules.allowedMimeTypes.includes(file.mimetype)) {
        errors.push(`File type ${file.mimetype} not allowed by custom rules`);
      }

      const extension = file.originalname.split('.').pop()?.toLowerCase();
      if (uploadDto.customValidationRules?.allowedExtensions?.length > 0 &&
          extension && !uploadDto.customValidationRules.allowedExtensions.includes(`.${extension}`)) {
        errors.push(`File extension .${extension} not allowed by custom rules`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    };

    const result = await this.fileUploadService.uploadFileWithCustomValidation(
      file,
      customValidation,
      {
        bucket: uploadDto.bucket,
        key: uploadDto.key,
        prefix: uploadDto.prefix,
        preserveOriginalName: uploadDto.preserveOriginalName,
      },
    );

    return result;
  }

  @Post('upload/test-pdf')
  @ApiOperation({ 
    summary: 'Test PDF upload with enhanced content type detection',
    description: 'Special endpoint to test PDF file uploads with proper content type handling'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        bucket: { type: 'string', example: 'my-bucket' },
        key: { type: 'string', example: 'test-pdf/document.pdf' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'PDF file uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Operation successful' },
        data: {
          type: 'object',
          properties: {
            key: { type: 'string', example: 'test-pdf/document.pdf' },
            bucket: { type: 'string', example: 'my-bucket' },
            size: { type: 'number', example: 70175 },
            contentType: { type: 'string', example: 'application/pdf' },
            lastModified: { type: 'string', format: 'date-time' },
            etag: { type: 'string', example: '3093fe00d383311bfac0909d5f24319e' },
            url: { type: 'string', example: 'https://bucket.s3.region.amazonaws.com/key' }
          }
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/s3/upload/test-pdf' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @UseInterceptors(FileInterceptor('file'))
  async testPdfUpload(
    @UploadedFile() file: MulterFile,
    @Body() body: { bucket?: string; key?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Force PDF content type detection
    const detectedContentType = this.detectContentType(file);
    
    if (detectedContentType !== 'application/pdf') {
      throw new BadRequestException(`File is not a PDF. Detected type: ${detectedContentType}`);
    }

    const bucket = body.bucket || 'my-bucket';
    const key = body.key || `test-pdf/${file.originalname}`;

    const metadata = await this.s3Service.uploadFile(
      bucket,
      key,
      file.buffer,
      {
        contentType: 'application/pdf',
        acl: 'private',
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size.toString(),
          testUpload: 'true',
          detectedContentType,
        },
      },
    );

    return {
      ...metadata,
      debug: {
        originalMimeType: file.mimetype,
        detectedContentType,
        fileName: file.originalname,
        fileSize: file.size,
      },
    };
  }

  @Post('upload/auto-detect')
  @ApiOperation({ 
    summary: 'Upload file with automatic content type detection demo',
    description: 'Demonstrates automatic content type detection for any file type. Shows detected content type in response.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Any file type. Content type will be automatically detected.',
        },
        bucket: { type: 'string', example: 'my-bucket' },
        key: { type: 'string', example: 'auto-detect/sample.pdf' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded with automatic content type detection',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Operation successful' },
        data: {
          type: 'object',
          properties: {
            key: { type: 'string', example: 'auto-detect/sample.pdf' },
            bucket: { type: 'string', example: 'my-bucket' },
            size: { type: 'number', example: 70175 },
            contentType: { type: 'string', example: 'application/pdf' },
            lastModified: { type: 'string', format: 'date-time' },
            etag: { type: 'string', example: '3093fe00d383311bfac0909d5f24319e' },
            url: { type: 'string', example: 'https://bucket.s3.region.amazonaws.com/key' },
            detectionInfo: {
              type: 'object',
              properties: {
                originalMimeType: { type: 'string', example: 'application/pdf' },
                detectedContentType: { type: 'string', example: 'application/pdf' },
                fileName: { type: 'string', example: 'sample.pdf' },
                fileExtension: { type: 'string', example: '.pdf' },
                detectionMethod: { type: 'string', example: 'extension-based' }
              }
            }
          }
        },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/s3/upload/auto-detect' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request or validation failed' })
  @UseInterceptors(FileInterceptor('file'))
  async autoDetectUpload(
    @UploadedFile() file: MulterFile,
    @Body() body: { bucket?: string; key?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Automatically detect content type
    const detectedContentType = this.detectContentType(file);
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    // Log the detection for debugging
    this.logger.log(`Auto-detect upload: ${file.originalname} -> ${detectedContentType}`);

    const bucket = body.bucket || 'my-bucket';
    const key = body.key || `auto-detect/${file.originalname}`;

    const metadata = await this.s3Service.uploadFile(
      bucket,
      key,
      file.buffer,
      {
        contentType: detectedContentType,
        acl: 'private',
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          fileSize: file.size.toString(),
          autoDetected: 'true',
          originalMimeType: file.mimetype,
          detectedContentType,
        },
      },
    );

    return {
      ...metadata,
      detectionInfo: {
        originalMimeType: file.mimetype,
        detectedContentType,
        fileName: file.originalname,
        fileExtension: `.${fileExtension}`,
        detectionMethod: file.mimetype === detectedContentType ? 'mime-type' : 'extension-based',
      },
    };
  }

  /**
   * Detect content type from file extension and MIME type
   */
  private detectContentType(file: MulterFile): string {
    let contentType = file.mimetype;
    
    // If MIME type is missing or incorrect, detect from file extension
    if (!contentType || contentType === 'application/octet-stream' || contentType === 'binary/octet-stream') {
      const extension = file.originalname.split('.').pop()?.toLowerCase();
      
      switch (extension) {
        // Images
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'svg':
          contentType = 'image/svg+xml';
          break;
        case 'bmp':
          contentType = 'image/bmp';
          break;
        case 'tiff':
        case 'tif':
          contentType = 'image/tiff';
          break;
        
        // Documents
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'doc':
          contentType = 'application/msword';
          break;
        case 'docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'rtf':
          contentType = 'application/rtf';
          break;
        case 'odt':
          contentType = 'application/vnd.oasis.opendocument.text';
          break;
        
        // Spreadsheets
        case 'xls':
          contentType = 'application/vnd.ms-excel';
          break;
        case 'xlsx':
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'ods':
          contentType = 'application/vnd.oasis.opendocument.spreadsheet';
          break;
        case 'csv':
          contentType = 'text/csv';
          break;
        
        // Presentations
        case 'ppt':
          contentType = 'application/vnd.ms-powerpoint';
          break;
        case 'pptx':
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
        case 'odp':
          contentType = 'application/vnd.oasis.opendocument.presentation';
          break;
        
        // Text files
        case 'txt':
          contentType = 'text/plain';
          break;
        case 'html':
        case 'htm':
          contentType = 'text/html';
          break;
        case 'css':
          contentType = 'text/css';
          break;
        case 'js':
          contentType = 'application/javascript';
          break;
        case 'json':
          contentType = 'application/json';
          break;
        case 'xml':
          contentType = 'application/xml';
          break;
        
        // Archives
        case 'zip':
          contentType = 'application/zip';
          break;
        case 'rar':
          contentType = 'application/x-rar-compressed';
          break;
        case '7z':
          contentType = 'application/x-7z-compressed';
          break;
        case 'tar':
          contentType = 'application/x-tar';
          break;
        case 'gz':
          contentType = 'application/gzip';
          break;
        
        // Audio
        case 'mp3':
          contentType = 'audio/mpeg';
          break;
        case 'wav':
          contentType = 'audio/wav';
          break;
        case 'ogg':
          contentType = 'audio/ogg';
          break;
        case 'm4a':
          contentType = 'audio/mp4';
          break;
        
        // Video
        case 'mp4':
          contentType = 'video/mp4';
          break;
        case 'avi':
          contentType = 'video/x-msvideo';
          break;
        case 'mov':
          contentType = 'video/quicktime';
          break;
        case 'wmv':
          contentType = 'video/x-ms-wmv';
          break;
        case 'flv':
          contentType = 'video/x-flv';
          break;
        case 'webm':
          contentType = 'video/webm';
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
}
