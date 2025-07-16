import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterSource } from '../core/domain/entities/master-source.entity';
import { MasterSourceController } from './master-source.controller';
import { MasterSourceService } from './master-source.service';
import { MasterSourceRepository } from './master-source.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterSource])],
  controllers: [MasterSourceController],
  providers: [
    MasterSourceService,
    MasterSourceRepository,
  ],
  exports: [MasterSourceService],
})
export class MasterSourceModule {} 