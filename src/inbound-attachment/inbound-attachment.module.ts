import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundAttachment } from '../core/domain/entities/inbound-attachment.entity';
import { InboundAttachmentController } from './inbound-attachment.controller';
import { InboundAttachmentService } from './inbound-attachment.service';
import { InboundAttachmentRepository } from './inbound-attachment.repository';
import { S3Module } from '../infrastructure/modules/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InboundAttachment]),
    S3Module,
  ],
  controllers: [InboundAttachmentController],
  providers: [
    InboundAttachmentService,
    InboundAttachmentRepository,
  ],
  exports: [InboundAttachmentService],
})
export class InboundAttachmentModule {} 