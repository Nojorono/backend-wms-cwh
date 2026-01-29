import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundRetur } from '../core/domain/entities/inbound-retur.entity';
import { InboundReturHelper } from '../core/domain/entities/inbound-retur-helper.entity';
import { InboundReturItem } from '../core/domain/entities/inbound-retur-item.entity';
import { InboundReturSorting } from '../core/domain/entities/inbound-retur-sorting.entity';
import { InboundReturController } from './inbound-retur.controller';
import { InboundReturService } from './inbound-retur.service';
import { InboundReturRepository } from './inbound-retur.repository';
import { PaginationModule } from '../core/modules/pagination.module';

@Module({
  imports: [
    PaginationModule,
    TypeOrmModule.forFeature([
      InboundRetur,
      InboundReturHelper,
      InboundReturItem,
      InboundReturSorting,
    ]),
  ],
  controllers: [InboundReturController],
  providers: [InboundReturService, InboundReturRepository],
  exports: [InboundReturService],
})
export class InboundReturModule {}
