import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedGateLoad } from '../core/domain/entities/assigned-gate-load.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';
import { AssignedGateLoadController } from './assigned-gate-load.controller';
import { AssignedGateLoadService } from './assigned-gate-load.service';
import { AssignedGateLoadRepository } from '../assigned-gate/repositories/assigned-gate-load.repository';
import { MasterPalletModule } from '../master-pallet/master-pallet.module';
import { InventoryTrackingModule } from '../inventory-tracking/inventory-tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssignedGateLoad, OutboundMemoItem]),
    MasterPalletModule,
    InventoryTrackingModule,
  ],
  controllers: [AssignedGateLoadController],
  providers: [AssignedGateLoadService, AssignedGateLoadRepository],
  exports: [AssignedGateLoadService],
})
export class AssignedGateLoadModule { }

