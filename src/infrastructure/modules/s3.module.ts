import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from '../services/s3.service';
import { S3Controller } from '../../presentation/controllers/s3.controller';
import { S3_SERVICE_TOKEN } from '../../core/domain/interfaces/s3.service.interface';

@Module({
  imports: [ConfigModule],
  controllers: [S3Controller],
  providers: [
    {
      provide: S3_SERVICE_TOKEN,
      useClass: S3Service,
    },
    S3Service,
  ],
  exports: [S3_SERVICE_TOKEN, S3Service],
})
export class S3Module {}
