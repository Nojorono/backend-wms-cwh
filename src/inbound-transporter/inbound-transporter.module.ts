import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundTransporter } from '../core/domain/entities/inbound-transporter.entity';
import { InboundTransporterController } from './inbound-transporter.controller';
import { InboundTransporterService } from './inbound-transporter.service';
import { InboundTransporterRepository } from './inbound-transporter.repository';
import { MasterVehicle } from '../core/domain/entities/master-vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InboundTransporter, MasterVehicle])],
  controllers: [InboundTransporterController],
  providers: [
    InboundTransporterService,
    InboundTransporterRepository,
  ],
  exports: [InboundTransporterService],
})
export class InboundTransporterModule {} 