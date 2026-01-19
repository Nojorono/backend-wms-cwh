import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedPickingService } from './assigned-picking.service';
import { AssignedPickingController } from './assigned-picking.controller';
import { AssignedPickingRepository } from './assigned-picking.repository';
import { AssignedPicking } from '../core/domain/entities/assigned-picking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssignedPicking])],
  controllers: [AssignedPickingController],
  providers: [AssignedPickingService, AssignedPickingRepository],
  exports: [AssignedPickingService, AssignedPickingRepository],
})
export class AssignedPickingModule {}
