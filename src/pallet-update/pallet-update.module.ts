import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PalletUpdate } from '../core/domain/entities/pallet-update.entity';
import { PalletUpdateItem } from '../core/domain/entities/pallet-update-item.entity';
import { PalletUpdateScan } from '../core/domain/entities/pallet-update-scan.entity';
import { PalletUpdateAssigned } from '../core/domain/entities/pallet-update-assigned.entity';
import { PalletUpdateController } from './pallet-update.controller';
import { PalletUpdateService } from './pallet-update.service';
import { PalletUpdateRepository } from './pallet-update.repository';
import { PaginationModule } from '../core/modules/pagination.module';
import { InventoryTrackingModule } from 'src/inventory-tracking/inventory-tracking.module';
import { MasterPalletModule } from 'src/master-pallet/master-pallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PalletUpdate,
      PalletUpdateItem,
      PalletUpdateScan,
      PalletUpdateAssigned,
    ]),
    PaginationModule,
    InventoryTrackingModule,
    MasterPalletModule,
  ],
  controllers: [PalletUpdateController],
  providers: [PalletUpdateService, PalletUpdateRepository],
  exports: [PalletUpdateService],
})
export class PalletUpdateModule { }
