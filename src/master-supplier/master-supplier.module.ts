import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MasterSupplier } from '../core/domain/entities/master-supplier.entity';
import { MasterSupplierController } from './master-supplier.controller';
import { MasterSupplierService } from './master-supplier.service';
import { MasterSupplierRepository } from './master-supplier.repository';
import { SupplierIntegrationService } from './integration/supplier-integration.service';

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
    ]),
  ],
  controllers: [MasterSupplierController],
  providers: [
    MasterSupplierService,
    MasterSupplierRepository,
    SupplierIntegrationService,
  ],
  exports: [MasterSupplierService, SupplierIntegrationService],
})
export class MasterSupplierModule {}
