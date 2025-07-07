import { Module } from '@nestjs/common';
import { BarcodeService } from '../services/barcode.service';
import { BarcodeController } from '../../presentation/controllers/barcode.controller';
import { S3Service } from '../services/s3.service';

@Module({
  imports: [],
  controllers: [BarcodeController],
  providers: [BarcodeService, S3Service],
  exports: [BarcodeService],
})
export class BarcodeModule {}
