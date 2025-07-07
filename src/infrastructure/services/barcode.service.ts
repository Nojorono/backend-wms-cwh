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

  private extractS3KeyFromUrl(url: string): string {
    try {
      if (url.includes('s3.amazonaws.com')) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
        

        if (pathParts.length > 1) {
          const key = pathParts.slice(1).join('/');
          return key;
        }
        const key = pathParts[0] || '';
        return key;
      } else if (url.includes('/')) {
        const urlParts = url.split('/');
        const keyParts = urlParts.slice(3);
        const key = keyParts.join('/');
        return key;
      }
      
      const lastSlashIndex = url.lastIndexOf('/');
      if (lastSlashIndex !== -1) {
        const key = url.substring(lastSlashIndex + 1);
        return key;
      }
      
      return url;
    } catch (error) {
      console.error('Error extracting S3 key from URL:', error);
      return url;
    }
  }

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

  async deleteBarcodeImage(barcodeImageUrl: string, bucket?: string): Promise<void> {
    // Extract bucket name from URL if not provided
    let s3Bucket = bucket;
    if (!s3Bucket && barcodeImageUrl.includes('s3.amazonaws.com')) {
      const urlObj = new URL(barcodeImageUrl);
      const hostname = urlObj.hostname;
      if (hostname.includes('.s3.')) {
        s3Bucket = hostname.split('.s3.')[0];
      } else {
        console.log('No bucket provided and URL does not contain s3.amazonaws.com');
      }
    } else if (!s3Bucket) {
      console.log('No bucket provided and URL does not contain s3.amazonaws.com');
    }
    
    if (!s3Bucket) {
      s3Bucket = this.configService.get<string>('AWS_S3_DEFAULT_BUCKET');
    }
    
    if (!s3Bucket) throw new Error('S3 bucket is required');
    
    let key = this.extractS3KeyFromUrl(barcodeImageUrl);
    
    if (key.startsWith('wms/')) {
      key = key.substring(4);
    }
    
    if (key && key !== barcodeImageUrl) {
      console.log('Proceeding with deletion of key:', key);
      await this.s3Service.deleteFile(s3Bucket, key);
    } else {
      console.log('Skipping deletion - invalid key extracted');
    }
  }
}
    