import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedHelper } from '../core/domain/entities/assigned-helper.entity';
import { AssignedHelperController } from './assigned-helper.controller';
import { AssignedHelperService } from './assigned-helper.service';
import { AssignedHelperRepository } from './repositories/assigned-helper.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AssignedHelper])],
  controllers: [AssignedHelperController],
  providers: [AssignedHelperService, AssignedHelperRepository],
  exports: [AssignedHelperService],
})
export class AssignedHelperModule {}
