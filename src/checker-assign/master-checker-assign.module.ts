import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckerAssign } from '../core/domain/entities/checker-assign.entity';
import { CheckerAssignController } from './master-checker-assign.controller';
import { CheckerAssignService } from './master-checker-assign.service';
import { CheckerAssignRepository } from './master-checker-assign.repository';
import { User } from '../core/domain/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckerAssign, User])],
  controllers: [CheckerAssignController],
  providers: [
    CheckerAssignService,
    CheckerAssignRepository,
  ],
  exports: [CheckerAssignService],
})
export class CheckerAssignModule {} 