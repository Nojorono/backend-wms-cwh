import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { MasterPalletController } from './master-pallet.controller';
import { MasterPalletService } from './master-pallet.service';
import { MasterPalletRepository } from './master-pallet.repository';
import { BarcodeModule } from 'src/infrastructure/modules/barcode.module';

@Module({
  imports: [TypeOrmModule.forFeature([MasterPallet]),BarcodeModule],
  controllers: [MasterPalletController],
  providers: [
    MasterPalletService,
    MasterPalletRepository,
  ],
  exports: [MasterPalletService],
})
export class MasterPalletModule {} 