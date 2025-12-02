import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignedGate } from '../core/domain/entities/assigned-gate.entity';
import { AssignedGateUser } from '../core/domain/entities/assigned-gate-user.entity';
import { AssignedGatePallet } from '../core/domain/entities/assigned-gate-pallet.entity';
import { AssignedGateController } from './assigned-gate.controller';
import { AssignedGateService } from './assigned-gate.service';
import { AssignedGateRepository } from './repositories/assigned-gate.repository';
import { AssignedGateUserRepository } from './repositories/assigned-gate-user.repository';
import { AssignedGatePalletRepository } from './repositories/assigned-gate-pallet.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AssignedGate, AssignedGateUser, AssignedGatePallet])],
  controllers: [AssignedGateController],
  providers: [AssignedGateService, AssignedGateRepository, AssignedGateUserRepository, AssignedGatePalletRepository],
  exports: [AssignedGateService],
})
export class AssignedGateModule {}

