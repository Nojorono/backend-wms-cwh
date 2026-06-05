import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboundIntegrationIrReq } from '../core/domain/entities/outbound-integration-ir-req.entity';
import { OutboundIntegrationIrReqLines } from '../core/domain/entities/outbound-integration-ir-req-lines.entity';
import { OutboundIntegrationIrReqController } from './outbound-integration-ir-req.controller';
import { OutboundIntegrationIrReqService } from './outbound-integration-ir-req.service';
import { OutboundIntegrationIrReqRepository } from './outbound-integration-ir-req.repository';
import { OutboundDoModule } from '../outbound-do/outbound-do.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboundIntegrationIrReq, OutboundIntegrationIrReqLines]),
    forwardRef(() => OutboundDoModule),
  ],
  controllers: [OutboundIntegrationIrReqController],
  providers: [OutboundIntegrationIrReqService, OutboundIntegrationIrReqRepository],
  exports: [OutboundIntegrationIrReqService, OutboundIntegrationIrReqRepository],
})
export class OutboundIntegrationIrReqModule {}
