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

@Module({
  imports: [TypeOrmModule.forFeature([Inbound, InboundDo, InboundItem])],
  controllers: [InboundController],
  providers: [InboundService, InboundRepository, InboundDoRepository, InboundItemRepository],
  exports: [InboundService],
})
export class InboundModule {}


