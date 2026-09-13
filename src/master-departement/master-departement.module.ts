import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterDepartement } from '../core/domain/entities/matser-departement.entity';
import { MasterDepartementController } from './master-departement.controller';
import { MasterDepartementService } from './master-departement.service';
import { MasterDepartementRepository } from './master-departement.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterDepartement])],
  controllers: [MasterDepartementController],
  providers: [MasterDepartementService, MasterDepartementRepository],
  exports: [MasterDepartementService],
})
export class MasterDepartementModule {}
