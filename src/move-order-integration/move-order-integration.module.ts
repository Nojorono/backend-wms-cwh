import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MoveOrderIntegration } from '../core/domain/entities/move-order-integration.entity';
import { MoveOrderLineIntegration } from '../core/domain/entities/move-order-integration-lines.entity';
import { MoveOrderIntegrationController } from './move-order-integration.controller';
import { MoveOrderIntegrationService } from './move-order-integration.service';
import { MoveOrderIntegrationRepository } from './move-order-integration.repository';
import { IntegrationMoveOrderService } from './integration/integration-move-order.service';
import {
  getMoveOrderIntegrationRmqOptions,
  getMoveOrderWmsRmqOptions,
} from './integration/move-order-integration-rmq.config';
import { MoveOrderIntegrationQueueProducer } from './integration/move-order-integration-queue.producer';
import { MoveOrderIntegrationQueueConsumer } from './integration/move-order-integration-queue.consumer';
import { MoveOrderIntegrationQueueWorker } from './integration/move-order-integration-queue.worker';
import { MoveOrderIntegrationPollProducer } from './integration/move-order-integration-poll.producer';
import { MoveOrderIntegrationPollConsumer } from './integration/move-order-integration-poll.consumer';
import { MoveOrderIntegrationPollService } from './integration/move-order-integration-poll.service';
import { MoveOrderIntegrationPollWorker } from './integration/move-order-integration-poll.worker';
import { MoveOrderIntegrationSyncService } from './integration/move-order-integration-sync.service';
import { MoveOrderIntegrationLogService } from './integration/move-order-integration-log.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([MoveOrderIntegration, MoveOrderLineIntegration]),
    ClientsModule.registerAsync([
      {
        name: 'MOVE_ORDER_WMS_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: getMoveOrderWmsRmqOptions(configService),
        }),
        inject: [ConfigService],
      },
      {
        name: 'MOVE_ORDER_INTEGRATION_QUEUE_CLIENT',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: getMoveOrderIntegrationRmqOptions(configService),
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MoveOrderIntegrationController],
  providers: [
    MoveOrderIntegrationService,
    MoveOrderIntegrationRepository,
    IntegrationMoveOrderService,
    MoveOrderIntegrationQueueProducer,
    MoveOrderIntegrationQueueConsumer,
    MoveOrderIntegrationQueueWorker,
    MoveOrderIntegrationPollProducer,
    MoveOrderIntegrationPollService,
    MoveOrderIntegrationPollConsumer,
    MoveOrderIntegrationPollWorker,
    MoveOrderIntegrationSyncService,
    MoveOrderIntegrationLogService,
  ],
  exports: [
    MoveOrderIntegrationService,
    MoveOrderIntegrationRepository,
    IntegrationMoveOrderService,
    MoveOrderIntegrationQueueProducer,
    MoveOrderIntegrationPollProducer,
  ],
})
export class MoveOrderIntegrationModule {}
