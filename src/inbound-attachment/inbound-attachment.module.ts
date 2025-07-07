import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundAttachment } from '../core/domain/entities/inbound-attachment.entity';
import { InboundAttachmentController } from './inbound-attachment.controller';
import { InboundAttachmentService } from './inbound-attachment.service';
import { InboundAttachmentRepository } from './inbound-attachment.repository';
import { S3Service } from 'src/infrastructure/services/s3.service';
import { S3_SERVICE_TOKEN } from 'src/core/domain/interfaces/s3.service.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([InboundAttachment]),
  ],
  controllers: [InboundAttachmentController],
  providers: [
    InboundAttachmentService,
    InboundAttachmentRepository,
    {
      provide: S3_SERVICE_TOKEN,
      useClass: S3Service,
    },
  ],
  exports: [InboundAttachmentService],
})
export class InboundAttachmentModule {} 