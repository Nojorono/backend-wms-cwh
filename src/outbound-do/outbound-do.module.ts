import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OutboundDoService } from './outbound-do.service';
import { OutboundDoController } from './outbound-do.controller';
import { OutboundDoRepository } from './outbound-do.repository';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';
import { TransactionPickingModule } from '../transaction-picking/transaction-picking.module';
import { OutboundIntegrationIrReqModule } from '../outbound-integration-ir-req/outbound-integration-ir-req.module';
import { OutboundIntegrationDeliveriesModule } from '../outbound-integration-deliveries/outbound-integration-deliveries.module';
import { IrRequestIntegrationService } from './integration/ir-request.integration';
import { ShipConfirmIntegrationService } from './integration/ship-confirm.integration';
import { OutboundIntegrationQueueProducer } from './integration/outbound-integration-queue.producer';
import { OutboundIntegrationQueueConsumer } from './integration/outbound-integration-queue.consumer';
import { OutboundIntegrationQueueWorker } from './integration/outbound-integration-queue.worker';
import { PoInternalReqStatusCheckerService } from './integration/po-internal-req-status-checker.service';
import { ShipConfirmStatusCheckerService } from './integration/ship-confirm-status-checker.service';
import { getOutboundIntegrationRmqOptions } from './integration/outbound-integration-rmq.config';
import { OutboundIntegrationIrReq } from 'src/core/domain/entities/outbound-integration-ir-req.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([OutboundDo, OutboundMemo, OutboundMemoItem, OutboundIntegrationIrReq  ]),
    TransactionPickingModule,
    forwardRef(() => OutboundIntegrationIrReqModule),
    OutboundIntegrationDeliveriesModule,
    ClientsModule.registerAsync([
      {
        name: 'PO_INTERNAL_REQ_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.poInternalReq') || 'po_internal_req_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'SHIP_CONFIRM_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.shipConfirm') || 'ship_confirm_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'OUTBOUND_INTEGRATION_QUEUE_CLIENT',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: getOutboundIntegrationRmqOptions(configService),
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [OutboundDoController],
  providers: [
    OutboundDoService,
    OutboundDoRepository,
    IrRequestIntegrationService,
    ShipConfirmIntegrationService,
    OutboundIntegrationQueueProducer,
    OutboundIntegrationQueueConsumer,
    OutboundIntegrationQueueWorker,
    PoInternalReqStatusCheckerService,
    ShipConfirmStatusCheckerService,
  ],
  exports: [
    OutboundDoService,
    OutboundDoRepository,
    IrRequestIntegrationService,
    ShipConfirmIntegrationService,
    PoInternalReqStatusCheckerService,
  ],
})
export class OutboundDoModule {}
