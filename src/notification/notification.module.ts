import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationHistoryService } from './notification-history.service';
import { NotificationHistoryRepository } from './notification-history.repository';
import { NotificationHistoryController } from './notification-history.controller';
import { NotificationHistory } from '../core/domain/entities/notification-history.entity';
import { PaginationModule } from '../core/modules/pagination.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationHistory]), PaginationModule],
  controllers: [NotificationHistoryController],
  providers: [
    NotificationGateway,
    NotificationService,
    NotificationHistoryService,
    NotificationHistoryRepository,
  ],
  exports: [NotificationService, NotificationHistoryService],
})
export class NotificationModule {}

