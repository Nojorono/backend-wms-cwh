import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedGate } from '../core/domain/entities/assigned-gate.entity';
import { AssignedGateUser } from '../core/domain/entities/assigned-gate-user.entity';
import { AssignedGatePallet } from '../core/domain/entities/assigned-gate-pallet.entity';
import { AssignedGateHelper } from '../core/domain/entities/assigned-gate-helper.entity';
import { AssignedGateController } from './assigned-gate.controller';
import { AssignedGateService } from './assigned-gate.service';
import { AssignedGateRepository } from './repositories/assigned-gate.repository';
import { AssignedGateUserRepository } from './repositories/assigned-gate-user.repository';
import { AssignedGatePalletRepository } from './repositories/assigned-gate-pallet.repository';
import { AssignedGateHelperRepository } from './repositories/assigned-gate-helper.repository';
import { MasterPalletModule } from '../master-pallet/master-pallet.module';
import { InventoryTrackingModule } from '../inventory-tracking/inventory-tracking.module';
import { MasterWarehouseSubModule } from '../master-warehouse-sub/master-warehouse-sub.module';
import { AssignedGateLoadRepository } from './repositories/assigned-gate-load.repository';
import { AssignedGateLoad } from '../core/domain/entities/assigned-gate-load.entity';
import { OutboundDoModule } from 'src/outbound-do/outbound-do.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssignedGate, AssignedGateUser, AssignedGatePallet, AssignedGateHelper, AssignedGateLoad]),
    MasterPalletModule,
    InventoryTrackingModule,
    MasterWarehouseSubModule,
    OutboundDoModule,
  ],
  controllers: [AssignedGateController],
  providers: [
    AssignedGateService,
    AssignedGateRepository,
    AssignedGateUserRepository,
    AssignedGatePalletRepository,
    AssignedGateHelperRepository,
    AssignedGateLoadRepository,
  ],
  exports: [AssignedGateService],
})
export class AssignedGateModule { }

