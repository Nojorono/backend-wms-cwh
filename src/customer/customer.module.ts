import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerMain } from '../core/domain/entities/customer-main.entity';
import { CustomerSubdist } from '../core/domain/entities/customer-subdist.entity';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './customer.repository';
import { CustomerMainIntegrationService } from './integration/customer-main-integration.service';
import { CustomerSubdistIntegrationService } from './integration/customer-subdist-integration.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([CustomerMain, CustomerSubdist]),
    ClientsModule.registerAsync([
      {
        name: 'HR_OPERATING_UNITS_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.hrOperatingUnits', 'hr_operating_units_queue'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'AR_CUSTOMERS_SD_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.arCustomersSd', 'ar_customers_sd_queue'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CustomerRepository,
    CustomerMainIntegrationService,
    CustomerSubdistIntegrationService,
  ],
  exports: [CustomerService, CustomerMainIntegrationService, CustomerSubdistIntegrationService],
})
export class CustomerModule {}

