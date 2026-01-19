import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MasterWeek } from '../core/domain/entities/master-week.entity';
import { MasterWeekController } from './master-week.controller';
import { MasterWeekService } from './master-week.service';
import { MasterWeekRepository } from './master-week.repository';
import { WeekListIntegrationService } from './integration/week-list-integration.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([MasterWeek]),
    ClientsModule.registerAsync([
      {
        name: 'WEEK_SALES_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
            queue: configService.get('rmq.weekSales') || 'week_sales_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [MasterWeekController],
  providers: [MasterWeekService, MasterWeekRepository, WeekListIntegrationService],
  exports: [MasterWeekService, WeekListIntegrationService],
})
export class MasterWeekModule {}
