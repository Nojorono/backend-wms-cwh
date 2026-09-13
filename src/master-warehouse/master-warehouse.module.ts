import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { MasterWarehouseController } from './master-warehouse.controller';
import { MasterWarehouseService } from './master-warehouse.service';
import { MasterWarehouseRepository } from './master-warehouse.repository';
import { WarehouseLocatorIntegrationService } from './integration/warehouse-locator.integration';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([MasterWarehouse]),
  ClientsModule.registerAsync([
    {
      name: 'INV_ON_HAND_QTY_SERVICE',
      useFactory: (configService: ConfigService) => ({
        transport: Transport.RMQ,
        options: {
          urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
          queue: configService.get('rmq.invOnHandQty') || 'inv_on_hand_qty_queue',
          queueOptions: {
            durable: false,
          },
        },
      }),
      inject: [ConfigService],
    },
  ]),
  ],
  controllers: [MasterWarehouseController],
  providers: [MasterWarehouseService, MasterWarehouseRepository, WarehouseLocatorIntegrationService],
  exports: [MasterWarehouseService],
})
export class MasterWarehouseModule { }
