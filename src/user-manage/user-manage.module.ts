import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserManage } from '../core/domain/entities/user-manage.entity';
import { UserManageController } from './user-manage.controller';
import { UserManageService } from './user-manage.service';
import { UserManageRepository } from './user-manage.repository';
import { PaginationService } from '../core/services/pagination.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserManage])],
  controllers: [UserManageController],
  providers: [
    UserManageService,
    UserManageRepository,
    PaginationService,
    {
      provide: 'IUserManageRepository',
      useClass: UserManageRepository,
    },
  ],
  exports: [UserManageService, UserManageRepository],
})
export class UserManageModule {}
