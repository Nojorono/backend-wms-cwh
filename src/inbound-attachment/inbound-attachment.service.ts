import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InboundAttachmentRepository } from './inbound-attachment.repository';
import { CreateInboundAttachmentDto } from './dto/create-inbound-attachment.dto';
import { UpdateInboundAttachmentDto } from './dto/update-inbound-attachment.dto';
import { InboundAttachment } from '../core/domain/entities/inbound-attachment.entity';
import { IS3Service, S3_SERVICE_TOKEN, S3FileMetadata } from '../core/domain/interfaces/s3.service.interface';

@Injectable()
export class InboundAttachmentService {
  constructor(
    private readonly repository: InboundAttachmentRepository,
    @Inject(S3_SERVICE_TOKEN)
    private readonly s3Service: IS3Service,
  ) {}

  async create(createInboundAttachmentDto: CreateInboundAttachmentDto): Promise<InboundAttachment> {
    return await this.repository.create(createInboundAttachmentDto);
  }

  async findAll(): Promise<InboundAttachment[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<InboundAttachment> {
    const inboundAttachment = await this.repository.findOne(id);
    if (!inboundAttachment) {
      throw new NotFoundException(`Inbound attachment with ID ${id} not found`);
    }
    return inboundAttachment;
  }

  async update(id: string, updateInboundAttachmentDto: UpdateInboundAttachmentDto): Promise<InboundAttachment> {
    const inboundAttachment = await this.findOne(id);
    if (!inboundAttachment) {
      throw new NotFoundException(`Inbound attachment with ID ${id} not found`);
  }
    await this.repository.update(id, updateInboundAttachmentDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async uploadFileWithDatabase(
    file: Buffer,
    filename: string,
    inboundPlanId?: string,
    organizationId?: number,
    options?: {
      contentType?: string;
      acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
    }
  ): Promise<InboundAttachment> {
    // Generate unique S3 key
    const extension = filename.split('.').pop() || '';
    const s3Key = this.s3Service.generateUniqueKey('inbound-attachments', extension);
    
    // Upload to S3
    const s3Metadata = await this.s3Service.uploadFile(
      'wms', // your bucket name
      s3Key,
      file,
      {
        contentType: options?.contentType || 'application/octet-stream',
        acl: options?.acl || 'public-read',
      }
    );

    // Create database record
    const createDto: CreateInboundAttachmentDto = {
      inbound_plan_id: inboundPlanId,
      organization_id: organizationId,
      name: filename,
      s3_bucket: s3Metadata.bucket,
      s3_key: s3Metadata.key,
      s3_url: s3Metadata.url || this.s3Service.getFileUrl(s3Metadata.bucket, s3Metadata.key),
      file_size: s3Metadata.size,
      content_type: s3Metadata.contentType,
      etag: s3Metadata.etag,
      is_public: options?.acl === 'public-read',
    };

    return await this.create(createDto);
  }

  async getFileUrl(attachmentId: string): Promise<string> {
    const attachment = await this.findOne(attachmentId);
    
    if (attachment.is_public) {
      return attachment.s3_url;
    } else {
      // Generate presigned URL for private files
      return await this.s3Service.generatePresignedDownloadUrl(
        attachment.s3_bucket,
        attachment.s3_key,
        { expiresIn: 3600 }
      );
    }
  }

  async deleteFileWithS3(attachmentId: string): Promise<void> {
    const attachment = await this.findOne(attachmentId);
    
    // Delete from S3
    await this.s3Service.deleteFile(attachment.s3_bucket, attachment.s3_key);
    
    // Delete from database
    await this.remove(attachmentId);
  }

  async updateFileAcl(attachmentId: string, acl: 'private' | 'public-read'): Promise<InboundAttachment> {
    const attachment = await this.findOne(attachmentId);
    
    // Update ACL in S3
    await this.s3Service.copyFile(
      attachment.s3_bucket,
      attachment.s3_key,
      attachment.s3_bucket,
      attachment.s3_key,
      { acl }
    );
    
    // Update database record
    await this.update(attachmentId, {
      is_public: acl === 'public-read'
    });
    
    return await this.findOne(attachmentId);
  }
}
