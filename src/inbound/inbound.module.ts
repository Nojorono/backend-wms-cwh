import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inbound } from 'src/core/domain/entities/inbound.entity';
import { InboundDo } from 'src/core/domain/entities/inbound-do.entity';
import { InboundItem } from 'src/core/domain/entities/inbound-item.entity';
import { PalletTransactionHistory } from 'src/core/domain/entities/transaction-pallet-history.entity';
import { InboundController } from 'src/inbound/inbound.controller';
import { InboundService } from 'src/inbound/inbound.service';
import { InboundRepository } from 'src/inbound/repositories/inbound.repository';
import { InboundDoRepository } from 'src/inbound/repositories/inbound-do.repository';
import { InboundItemRepository } from 'src/inbound/repositories/inbound-item.repository';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { DoValidationIntegrationService } from './integration/do-validation.integration';
import { InboundMappingIntegrationService } from './integration/inbound-mapping-integration.service';
import { SalesOrderIntegrationService } from './integration/sales-order.integration';
import { RcvReceiptIntegrationService } from './integration/rcv-receipt.integration';
import { PurchaseOrderIntegrationService } from 'src/inbound/integration/purchase-order.integration';
import { InboundIntegrationModule } from 'src/inbound-integration/inbound-integration.module';
import { InboundIntegrationQueueProducer } from './integration/inbound-integration-queue.producer';
import { InboundIntegrationQueueConsumer } from './integration/inbound-integration-queue.consumer';
import { OracleInboundStatusCheckerService } from './integration/oracle-inbound-status-checker.service';
import { InboundIntegrationQueueWorker } from './integration/inbound-integration-queue.worker';
import { getInboundIntegrationRmqOptions } from './integration/inbound-integration-rmq.config';
import { TransactionScanInboundModule } from 'src/transaction-scan-inbound/transaction-scan-inbound.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => InboundIntegrationModule),
    TransactionScanInboundModule,
    TypeOrmModule.forFeature([Inbound, InboundDo, InboundItem, PalletTransactionHistory]),
    ClientsModule.registerAsync([
      {
        name: 'DO_VALIDATION_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.doValidation', 'do_validation_queue'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'RCV_RECEIPT_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.rcvReceipt', 'rcv_receipt_queue'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PURCHASE_ORDER_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.purchaseOrder') || 'purchase_order_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'SALES_ORDER_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.salesOrder', 'sales_order_queue'),
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'INBOUND_INTEGRATION_QUEUE_CLIENT',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: getInboundIntegrationRmqOptions(configService),
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [InboundController],
  providers: [
    InboundService,
    InboundRepository,
    InboundDoRepository,
    InboundItemRepository,
    DoValidationIntegrationService,
    RcvReceiptIntegrationService,
    PurchaseOrderIntegrationService,
    SalesOrderIntegrationService,
    InboundMappingIntegrationService,
    InboundIntegrationQueueProducer,
    InboundIntegrationQueueConsumer,
    InboundIntegrationQueueWorker,
    OracleInboundStatusCheckerService,
  ],
  exports: [InboundService, OracleInboundStatusCheckerService],
})
export class InboundModule { }
