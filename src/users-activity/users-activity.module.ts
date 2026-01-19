import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersActivityService } from './users-activity.service';
import { UsersActivityController } from './users-activity.controller';
import { UsersActivityRepository } from './users-activity.repository';
import { UsersActivity } from '../core/domain/entities/users-activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsersActivity])],
  controllers: [UsersActivityController],
  providers: [UsersActivityService, UsersActivityRepository],
  exports: [UsersActivityService, UsersActivityRepository],
})
export class UsersActivityModule {}

