import { Module } from '@nestjs/common';
import { BarcodeService } from '../services/barcode.service';
import { S3Module } from './s3.module';
import { BarcodeController } from '../../presentation/controllers/barcode.controller';

@Module({
  imports: [S3Module],
  controllers: [BarcodeController],
  providers: [BarcodeService],
  exports: [BarcodeService],
})
export class BarcodeModule {}
