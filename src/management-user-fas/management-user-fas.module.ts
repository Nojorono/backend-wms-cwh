import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagementUserFas } from '../core/domain/entities/management-user-fas.entity';
import { ManagementUserFasController } from './management-user-fas.controller';
import { ManagementUserFasService } from './management-user-fas.service';
import { ManagementUserFasRepository } from './management-user-fas.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ManagementUserFas])],
  controllers: [ManagementUserFasController],
  providers: [ManagementUserFasService, ManagementUserFasRepository],
  exports: [ManagementUserFasService, ManagementUserFasRepository],
})
export class ManagementUserFasModule {}
