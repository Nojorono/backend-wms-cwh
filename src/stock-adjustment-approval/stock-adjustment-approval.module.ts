import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAdjustmentApproval } from '../core/domain/entities/stock-adjustment-approval.entity';
import { StockAdjustmentApprovalController } from './stock-adjustment-approval.controller';
import { StockAdjustmentApprovalService } from './stock-adjustment-approval.service';
import { StockAdjustmentApprovalRepository } from './repositories/stock-adjustment-approval.repository';
import { MasterPalletModule } from '../master-pallet/master-pallet.module';
import { PaginationModule } from '../core/modules/pagination.module';
import { InventoryTrackingModule } from '../inventory-tracking/inventory-tracking.module';
import { ApprovalModule } from '../approval/approval.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockAdjustmentApproval]),
    MasterPalletModule,
    PaginationModule,
    InventoryTrackingModule,
    forwardRef(() => ApprovalModule),
  ],
  controllers: [StockAdjustmentApprovalController],
  providers: [StockAdjustmentApprovalService, StockAdjustmentApprovalRepository],
  exports: [StockAdjustmentApprovalService],
})
export class StockAdjustmentApprovalModule {}

