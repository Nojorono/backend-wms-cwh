import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundIntegration } from 'src/core/domain/entities/inbound-integration.entity';
import { InboundIntegrationLines } from 'src/core/domain/entities/inbound-integration-lines.entity';
import { InboundIntegrationController } from './inbound-integration.controller';
import { InboundIntegrationService } from './inbound-integration.service';
import { InboundIntegrationRepository } from './inbound-integration.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InboundIntegration, InboundIntegrationLines])],
  controllers: [InboundIntegrationController],
  providers: [InboundIntegrationService, InboundIntegrationRepository],
  exports: [InboundIntegrationService],
})
export class InboundIntegrationModule {}
