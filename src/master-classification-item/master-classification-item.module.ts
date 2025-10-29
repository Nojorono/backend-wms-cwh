import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterClassificationItem } from '../core/domain/entities/master-classification-item.entity';
import { MasterClassificationItemController } from './master-classification-item.controller';
import { MasterClassificationItemService } from './master-classification-item.service';
import { MasterClassificationItemRepository } from './master-classification-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterClassificationItem])],
  controllers: [MasterClassificationItemController],
  providers: [MasterClassificationItemService, MasterClassificationItemRepository],
  exports: [MasterClassificationItemService],
})
export class MasterClassificationItemModule {}
