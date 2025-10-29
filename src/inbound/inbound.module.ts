import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inbound } from 'src/core/domain/entities/inbound.entity';
import { InboundDo } from 'src/core/domain/entities/inbound-do.entity';
import { InboundItem } from 'src/core/domain/entities/inbound-item.entity';
import { InboundController } from 'src/inbound/inbound.controller';
import { InboundService } from 'src/inbound/inbound.service';
import { InboundRepository } from 'src/inbound/repositories/inbound.repository';
import { InboundDoRepository } from 'src/inbound/repositories/inbound-do.repository';
import { InboundItemRepository } from 'src/inbound/repositories/inbound-item.repository';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { DoValidationIntegrationService } from './integration/do-validation.integration';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Inbound, InboundDo, InboundItem]),
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
    ]),
  ],
  controllers: [InboundController],
  providers: [
    InboundService,
    InboundRepository,
    InboundDoRepository,
    InboundItemRepository,
    DoValidationIntegrationService,
  ],
  exports: [InboundService],
})
export class InboundModule {}
