import { Module } from '@nestjs/common';
import { ShipmentPlanController } from './shipment-plan.controller';
import { ShipmentPlanService } from './shipment-plan.service';

@Module({
    controllers: [ShipmentPlanController],
    providers: [ShipmentPlanService],
})
export class ShipmentPlanModule { }
