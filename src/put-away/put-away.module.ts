import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PutAwayController } from './put-away.controller';
import { PutAwayService } from './put-away.service';
import { PutAwayRepository } from './put-away.repository';
import { PutAwayTransaction } from 'src/core/domain/entities/transaction-put-away.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PutAwayTransaction])],
  controllers: [PutAwayController],
  providers: [PutAwayService, PutAwayRepository],
  exports: [PutAwayService],
})
export class PutAwayModule {}


