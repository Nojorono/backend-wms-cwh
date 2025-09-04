import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { MasterItemController } from './master-item.controller';
import { MasterItemService } from './master-item.service';
import { MasterItemRepository } from './master-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterItem])],
  controllers: [MasterItemController],
  providers: [MasterItemService, MasterItemRepository],
  exports: [MasterItemService],
})
export class MasterItemModule {}
