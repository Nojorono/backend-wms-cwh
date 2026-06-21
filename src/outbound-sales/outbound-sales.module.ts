import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OnHandAtr } from '../core/domain/entities/on-hand-atr.entity';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { DoSuggestionModule } from '../do-suggestion/do-suggestion.module';
import { IntegrationOnHandAtrService } from './integration/integration-on-hand-atr.service';
import { OutboundSalesController } from './outbound-sales.controller';
import { OutboundSalesService } from './outbound-sales.service';
import { OnHandAtrRepository } from './on-hand-atr.repository';

@Module({
  imports: [
    ConfigModule,
    DoSuggestionModule,
    TypeOrmModule.forFeature([OnHandAtr, MasterIO]),
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
  controllers: [OutboundSalesController],
  providers: [IntegrationOnHandAtrService, OutboundSalesService, OnHandAtrRepository],
  exports: [IntegrationOnHandAtrService, OutboundSalesService, OnHandAtrRepository],
})
export class OutboundSalesModule { }