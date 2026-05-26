import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MasterSupplier } from '../core/domain/entities/master-supplier.entity';
import { MasterSupplierController } from './master-supplier.controller';
import { MasterSupplierService } from './master-supplier.service';
import { MasterSupplierRepository } from './master-supplier.repository';
import { SupplierIntegrationService } from './integration/supplier-integration.service';
import { PoLineIntegrationService } from './integration/po-line-integration.service';
import { TruckUtilIntegrationService } from './integration/truck-util-integration.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([MasterSupplier]),
    ClientsModule.registerAsync([
      {
        name: 'SUPPLIER_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.supplier') || 'supplier_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PO_LINE_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.poLine') || 'po_line_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'TRUCK_UTIL_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.truckUtil') || 'truck_util_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MasterSupplierController],
  providers: [
    MasterSupplierService,
    MasterSupplierRepository,
    SupplierIntegrationService,
    PoLineIntegrationService,
    TruckUtilIntegrationService,
  ],
  exports: [
    MasterSupplierService,
    SupplierIntegrationService,
    PoLineIntegrationService,
    TruckUtilIntegrationService,
  ],
})
export class MasterSupplierModule {}
