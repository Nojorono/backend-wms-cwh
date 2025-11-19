import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalSetup } from '../core/domain/entities/approval-setup.entity';
import { ApprovalLevel } from '../core/domain/entities/approval-level.entity';
import { ApprovalSetupController } from './approval-setup.controller';
import { ApprovalSetupService } from './approval-setup.service';
import { ApprovalSetupRepository } from './repositories/approval-setup.repository';
import { PaginationModule } from '../core/modules/pagination.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApprovalSetup, ApprovalLevel]),
    PaginationModule,
  ],
  controllers: [ApprovalSetupController],
  providers: [ApprovalSetupService, ApprovalSetupRepository],
  exports: [ApprovalSetupService],
})
export class ApprovalSetupModule {}

