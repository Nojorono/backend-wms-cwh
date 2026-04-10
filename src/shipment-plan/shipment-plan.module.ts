import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentPlanController } from './shipment-plan.controller';
import { ShipmentPlanService } from './shipment-plan.service';
import { ShipmentPlanRepository } from './shipment-plan.repository';
import { ShipmentPlanItemRepository } from './shipment-plan-item.repository';
import { ShipmentPlan } from '../core/domain/entities/shipment-plan.entity';
import { ShipmentPlanItem } from '../core/domain/entities/shipment-plan-item.entity';
import { MasterWeek } from '../core/domain/entities/master-week.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ShipmentPlan, ShipmentPlanItem, MasterWeek])],
    controllers: [ShipmentPlanController],
    providers: [ShipmentPlanService, ShipmentPlanRepository, ShipmentPlanItemRepository],
})
export class ShipmentPlanModule { }
