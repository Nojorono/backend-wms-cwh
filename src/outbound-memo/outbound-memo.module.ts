import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboundMemoService } from './outbound-memo.service';
import { OutboundMemoController } from './outbound-memo.controller';
import { OutboundMemoRepository } from './outbound-memo.repository';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboundMemo, OutboundMemoItem]),
  ],
  controllers: [OutboundMemoController],
  providers: [OutboundMemoService, OutboundMemoRepository],
  exports: [OutboundMemoService, OutboundMemoRepository],
})
export class OutboundMemoModule {}
