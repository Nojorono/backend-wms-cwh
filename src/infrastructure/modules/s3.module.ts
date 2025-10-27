import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { S3Service } from '../services/s3.service';
import { S3Controller } from '../../presentation/controllers/s3.controller';
import { S3_SERVICE_TOKEN } from '../../core/domain/interfaces/s3.service.interface';
import { FileUploadService } from '../../infrastructure/services/file-upload.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 10, // Maximum 10 files
      },
      fileFilter: (req, file, callback) => {
        // Allow all file types by default, can be customized
        callback(null, true);
      },
    }),
  ],
  controllers: [S3Controller],
  providers: [
    {
      provide: S3_SERVICE_TOKEN,
      useClass: S3Service,
    },
    S3Service,
    FileUploadService,
  ],
  exports: [S3_SERVICE_TOKEN, S3Service, FileUploadService],
})
export class S3Module {}
