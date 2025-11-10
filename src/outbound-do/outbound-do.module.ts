import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboundDoService } from './outbound-do.service';
import { OutboundDoController } from './outbound-do.controller';
import { OutboundDoRepository } from './outbound-do.repository';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboundDo, OutboundMemo, OutboundMemoItem]),
  ],
  controllers: [OutboundDoController],
  providers: [OutboundDoService, OutboundDoRepository],
  exports: [OutboundDoService, OutboundDoRepository],
})
export class OutboundDoModule {}
