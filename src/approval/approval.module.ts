import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Approval } from '../core/domain/entities/approval.entity';
import { ApprovalLevel } from '../core/domain/entities/approval-level.entity';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { ApprovalRepository } from './repositories/approval.repository';
import { ApprovalSetupModule } from '../approval-setup/approval-setup.module';
import { PaginationModule } from '../core/modules/pagination.module';
import { StockAdjustmentApprovalModule } from '../stock-adjustment-approval/stock-adjustment-approval.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Approval, ApprovalLevel]),
    ApprovalSetupModule,
    PaginationModule,
    forwardRef(() => StockAdjustmentApprovalModule),
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService, ApprovalRepository],
  exports: [ApprovalService],
})
export class ApprovalModule {}

