import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { MasterItemController } from './master-item.controller';
import { MasterItemService } from './master-item.service';
import { MasterItemRepository } from './master-item.repository';
import { ItemListIntegrationService } from './integration/item-list-integration.service';
import { SalesItemIntegrationService } from './integration/sales-item-integration.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([MasterItem]),
    ClientsModule.registerAsync([
      {
        name: 'ITEM_LIST_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.itemList', 'item_list_queue'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'SALES_ITEM_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.salesItem') || 'sales_item_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MasterItemController],
  providers: [
    MasterItemService,
    MasterItemRepository,
    ItemListIntegrationService,
    SalesItemIntegrationService,
  ],
  exports: [MasterItemService, ItemListIntegrationService, SalesItemIntegrationService],
})
export class MasterItemModule { }
