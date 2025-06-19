import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { MasterIOController } from './master-io.controller';
import { MasterIOService } from './master-io.service';
import { MasterIORepository } from './master-io.repository';

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