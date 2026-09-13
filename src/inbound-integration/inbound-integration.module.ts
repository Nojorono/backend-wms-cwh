import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundIntegration } from 'src/core/domain/entities/inbound-integration.entity';
import { InboundIntegrationLines } from 'src/core/domain/entities/inbound-integration-lines.entity';
import { InboundIntegrationController } from './inbound-integration.controller';
import { InboundIntegrationService } from './inbound-integration.service';
import { InboundIntegrationRepository } from './inbound-integration.repository';
import { InboundIntegrationPollService } from './inbound-integration-poll.service';
import { InboundModule } from 'src/inbound/inbound.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InboundIntegration, InboundIntegrationLines]),
    forwardRef(() => InboundModule),
  ],
  controllers: [InboundIntegrationController],
  providers: [InboundIntegrationService, InboundIntegrationRepository, InboundIntegrationPollService],
  exports: [InboundIntegrationService],
})
export class InboundIntegrationModule {}
