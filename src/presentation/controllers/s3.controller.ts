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
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { IS3Service, S3_SERVICE_TOKEN } from '../../core/domain/interfaces/s3.service.interface';
import {
  UploadFileDto,
  UploadMultipleFilesDto,
  DownloadFileDto,
  DeleteFileDto,
  CopyFileDto,
  ListFilesDto,
  PresignedUrlDto,
} from '../../core/application/dtos/s3/upload-file.dto';

@ApiTags('S3 File Management')
@Controller('s3')
@ApiBearerAuth('JWT-auth')
export class S3Controller {
  constructor(
    @Inject(S3_SERVICE_TOKEN)
    private readonly s3Service: IS3Service,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bucket: { type: 'string', example: 'my-bucket' },
        key: { type: 'string', example: 'uploads/file.txt' },
        file: {
          type: 'string',
          format: 'binary',
        },
        contentType: { type: 'string', example: 'text/plain' },
        acl: { 
          type: 'string', 
          enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
          example: 'private'
        },
      },
      required: ['bucket', 'key', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body() uploadDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');    
    }

    const metadata = await this.s3Service.uploadFile(
      uploadDto.bucket,
      uploadDto.key,
      file.buffer,
      {
        contentType: uploadDto.contentType || uploadDto.options?.contentType || file.mimetype,
        acl: uploadDto.acl || uploadDto.options?.acl,
        metadata: uploadDto.options?.metadata,
        cacheControl: uploadDto.options?.cacheControl,
        expires: uploadDto.options?.expires ? new Date(uploadDto.options.expires) : undefined,
      },
    );

    return {
      success: true,
      data: metadata,
      message: 'File uploaded successfully',
    };
  }

  @Get('download/:bucket/*path')
  @ApiOperation({ summary: 'Download a file from S3' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
    @Query() downloadDto: DownloadFileDto,
  ) {
    const fileBuffer = await this.s3Service.downloadFile(bucket, key, {
      responseContentType: downloadDto.options?.responseContentType,
      responseContentDisposition: downloadDto.options?.responseContentDisposition,
      responseCacheControl: downloadDto.options?.responseCacheControl,
    });

    return {
      success: true,
      data: {
        bucket,
        key,
        size: fileBuffer.length,
        content: fileBuffer.toString('base64'),
      },
      message: 'File downloaded successfully',
    };
  }

  @Get('metadata/:bucket/*path')
  @ApiOperation({ summary: 'Get file metadata from S3' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFileMetadata(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
  ) {
    const metadata = await this.s3Service.getFileMetadata(bucket, key);

    return {
      success: true,
      data: metadata,
      message: 'File metadata retrieved successfully',
    };
  }

  @Get('exists/:bucket/*path')
  @ApiOperation({ summary: 'Check if file exists in S3' })
  @ApiResponse({ status: 200, description: 'File existence checked successfully' })
  async fileExists(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
  ) {
    const exists = await this.s3Service.fileExists(bucket, key);

    return {
      success: true,
      data: { exists },
      message: `File ${exists ? 'exists' : 'does not exist'}`,
    };
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

    return {
      success: true,
      data: result,
      message: 'Files listed successfully',
    };
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

    return {
      success: true,
      data: metadata,
      message: 'File copied successfully',
    };
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

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  @Post('presigned-upload-url')
  @ApiOperation({ summary: 'Generate presigned upload URL' })
  @ApiResponse({ status: 200, description: 'Presigned upload URL generated successfully' })
  async generatePresignedUploadUrl(@Body() presignedDto: PresignedUrlDto) {
    const url = await this.s3Service.generatePresignedUploadUrl(
      presignedDto.bucket,
      presignedDto.key,
      {
        expiresIn: presignedDto.expiresIn,
        contentType: presignedDto.contentType,
      },
    );

    return {
      success: true,
      data: { url },
      message: 'Presigned upload URL generated successfully',
    };
  }

  @Post('presigned-download-url')
  @ApiOperation({ summary: 'Generate presigned download URL' })
  @ApiResponse({ status: 200, description: 'Presigned download URL generated successfully' })
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

    return {
      success: true,
      data: { url },
      message: 'Presigned download URL generated successfully',
    };
  }

  @Get('url/:bucket/*path')
  @ApiOperation({ summary: 'Get public URL for a file' })
  @ApiResponse({ status: 200, description: 'File URL retrieved successfully' })
  async getFileUrl(
    @Param('bucket') bucket: string,
    @Param('path') key: string,
  ) {
    const url = this.s3Service.getFileUrl(bucket, key);

    return {
      success: true,
      data: { url },
      message: 'File URL retrieved successfully',
    };
  }

  @Post('generate-key')
  @ApiOperation({ summary: 'Generate a unique file key' })
  @ApiResponse({ status: 200, description: 'Unique key generated successfully' })
  async generateUniqueKey(
    @Body() body: { prefix?: string; extension?: string },
  ) {
    const key = this.s3Service.generateUniqueKey(body.prefix, body.extension);

    return {
      success: true,
      data: { key },
      message: 'Unique key generated successfully',
    };
  }
} 