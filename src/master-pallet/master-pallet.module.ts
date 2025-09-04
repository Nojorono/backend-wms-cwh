import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { MasterPalletController } from './master-pallet.controller';
import { MasterPalletService } from './master-pallet.service';
import { MasterPalletRepository } from './master-pallet.repository';
import { S3Service } from 'src/infrastructure/services/s3.service';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';

@Module({
  imports: [TypeOrmModule.forFeature([MasterPallet])],
  controllers: [MasterPalletController],
  providers: [
    MasterPalletService,
    MasterPalletRepository,
    S3Service,
    BarcodeService,
  ],
  exports: [MasterPalletService],
})
export class MasterPalletModule {}
