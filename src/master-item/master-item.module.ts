import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { MasterIOController } from './master-item.controller';
import { MasterIOService } from './master-item.service';
import { MasterIORepository } from './master-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterIO])],
  controllers: [MasterIOController],
  providers: [
    MasterIOService,
    MasterIORepository,
  ],
  exports: [MasterIOService],
})
export class MasterIOModule {} 