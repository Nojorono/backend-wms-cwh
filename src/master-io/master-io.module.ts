import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { MasterIOController } from './master-io.controller';
import { MasterIOService } from './master-io.service';
import { MasterIORepository } from './master-io.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IOIntegrationService } from './integration/io-integration.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([MasterIO]),
    ClientsModule.registerAsync([
      {
        name: 'ONT_BRANCHES_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.ontBranches') || 'ont_branches_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MasterIOController],
  providers: [MasterIOService, MasterIORepository, IOIntegrationService],
  exports: [MasterIOService],
})
export class MasterIOModule {}
