import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Service } from "./s3.service";
import * as bwipjs from 'bwip-js';

@Injectable()
export class BarcodeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {}

  async uploadBarcodeImage(params: {
    file: Buffer;
    contentType?: string;
    prefix?: string;
    extension?: string;
    bucket?: string;
    metadata?: Record<string, string>;
    acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
  }) {
    const bucket = params.bucket || this.configService.get<string>('AWS_S3_DEFAULT_BUCKET');
    if (!bucket) throw new Error('S3 bucket is required');
    const key = this.s3Service.generateUniqueKey(params.prefix || 'barcode-images', params.extension);
    const metadata = await this.s3Service.uploadFile(
      bucket,
      key,
      params.file,
      {
        contentType: params.contentType,
        acl: params.acl,
        metadata: params.metadata,
      },
    );
    return metadata;
  }

  async generateAndStoreBarcode(options: {
    bcid: string; // Barcode type, e.g. 'code128', 'qrcode', etc.
    text: string; // Barcode data
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: 'center' | 'offleft' | 'left' | 'right' | 'offright' | 'justify';
    bucket?: string;
    prefix?: string;
    extension?: string;
    acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
    metadata?: Record<string, string>;
  }) {
    // Generate barcode image as PNG buffer
    const pngBuffer = await bwipjs.toBuffer({
      bcid: options.bcid,
      text: options.text,
      scale: options.scale || 3,
      height: options.height || 10,
      width: options.width,
      includetext: options.includetext ?? true,
      textxalign: options.textxalign || 'center',
    });
    // Upload to S3
    return this.uploadBarcodeImage({
      file: pngBuffer,
      contentType: 'image/png',
      prefix: options.prefix,
      extension: options.extension || 'png',
      bucket: options.bucket,
      metadata: options.metadata,
      acl: options.acl,
    });
  }
}
    