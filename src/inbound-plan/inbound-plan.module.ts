import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundPlan } from '../core/domain/entities/inbound-plan.entity';
import { InboundPlanController } from './inbound-plan.controller';
import { InboundPlanService } from './inbound-plan.service';
import { InboundPlanRepository } from './inbound-plan.repository';
import { MasterIORepository } from '../master-io/master-io.repository'; 
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { InboundPlanItem } from '../core/domain/entities/inbound-plan-item.entity';
import { InboundPlanItemRepository } from './inbound-plan-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InboundPlan, MasterIO, InboundPlanItem])],
  controllers: [InboundPlanController],
  providers: [
    InboundPlanService,
    InboundPlanRepository,
    MasterIORepository,
    InboundPlanItemRepository,
  ],
  exports: [InboundPlanService],
})
export class InboundPlanModule {} 