import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterVehicle } from '../core/domain/entities/master-vehicle.entity';
import { MasterVehicleController } from './master-vehicle.controller';
import { MasterVehicleService } from './master-vehicle.service';
import { MasterVehicleRepository } from './master-vehicle.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterVehicle])],
  controllers: [MasterVehicleController],
  providers: [MasterVehicleService, MasterVehicleRepository],
  exports: [MasterVehicleService],
})
export class MasterVehicleModule {}
