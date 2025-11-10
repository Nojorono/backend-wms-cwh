import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PickingSuggestionController } from './picking-suggestion.controller';
import { PickingSuggestionService } from './picking-suggestion.service';
import { PickingSuggestionRepository } from './picking-suggestion.repository';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboundDo, OutboundMemo, InventoryTracking, MasterItem]),
  ],
  controllers: [PickingSuggestionController],
  providers: [PickingSuggestionService, PickingSuggestionRepository],
  exports: [PickingSuggestionService, PickingSuggestionRepository],
})
export class PickingSuggestionModule {}

