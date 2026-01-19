import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';
import { Express } from 'express';
import { CreateBarcodeDto } from 'src/core/application/dtos/barcode/create-barcode.dto';

class UploadBarcodeImageDto {
  // Add more fields as needed for barcode metadata
  bucket?: string;
  prefix?: string;
  extension?: string;
  contentType?: string;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  metadata?: Record<string, string>;
}

@ApiTags('Barcode')
@Controller('barcode')
@ApiBearerAuth('JWT-auth')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a barcode image to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        bucket: { type: 'string', example: 'my-bucket' },
        prefix: { type: 'string', example: 'barcode-images' },
        extension: { type: 'string', example: 'png' },
        contentType: { type: 'string', example: 'image/png' },
        acl: {
          type: 'string',
          enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
          example: 'private',
        },
        metadata: { type: 'object', additionalProperties: { type: 'string' } },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Barcode image uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadBarcodeImage(@UploadedFile() file: any, @Body() body: UploadBarcodeImageDto) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const metadata = await this.barcodeService.uploadBarcodeImage({
      file: file.buffer,
      contentType: body.contentType || file.mimetype,
      prefix: body.prefix,
      extension: body.extension || file.originalname.split('.').pop(),
      bucket: body.bucket,
      metadata: body.metadata,
      acl: body.acl,
    });
    return {
      success: true,
      data: metadata,
      message: 'Barcode image uploaded successfully',
    };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a barcode image and store in S3' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bcid: { type: 'string', example: 'code128' },
        text: { type: 'string', example: '1234567890' },
        scale: { type: 'number', example: 3 },
        height: { type: 'number', example: 10 },
        width: { type: 'number', example: 200 },
        includetext: { type: 'boolean', example: true },
        textxalign: { type: 'string', example: 'center' },
        bucket: { type: 'string', example: 'my-bucket' },
        prefix: { type: 'string', example: 'barcode-images' },
        extension: { type: 'string', example: 'png' },
        acl: {
          type: 'string',
          enum: ['private', 'public-read', 'public-read-write', 'authenticated-read'],
          example: 'private',
        },
        metadata: { type: 'object', additionalProperties: { type: 'string' } },
      },
      required: ['bcid', 'text'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Barcode image generated and uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @HttpCode(HttpStatus.CREATED)
  async generateAndStoreBarcode(@Body() body: CreateBarcodeDto) {
    if (!body.bcid || !body.text) {
      throw new BadRequestException('bcid and text are required');
    }
    const metadata = await this.barcodeService.generateAndStoreBarcode(body);
    return {
      success: true,
      data: metadata,
      message: 'Barcode image generated and uploaded successfully',
    };
  }
}
