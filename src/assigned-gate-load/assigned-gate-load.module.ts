import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedGateLoad } from '../core/domain/entities/assigned-gate-load.entity';
import { AssignedGateLoadController } from './assigned-gate-load.controller';
import { AssignedGateLoadService } from './assigned-gate-load.service';
import { AssignedGateLoadRepository } from '../assigned-gate/repositories/assigned-gate-load.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AssignedGateLoad])],
  controllers: [AssignedGateLoadController],
  providers: [AssignedGateLoadService, AssignedGateLoadRepository],
  exports: [AssignedGateLoadService],
})
export class AssignedGateLoadModule {}

