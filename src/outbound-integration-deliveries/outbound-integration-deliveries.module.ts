import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboundIntegrationDeliveries } from '../core/domain/entities/outbound-integration-deliveries.entity';
import { OutboundIntegrationDeliveriesController } from './outbound-integration-deliveries.controller';
import { OutboundIntegrationDeliveriesService } from './outbound-integration-deliveries.service';
import { OutboundIntegrationDeliveriesRepository } from './outbound-integration-deliveries.repository';
import { OutboundDoModule } from '../outbound-do/outbound-do.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboundIntegrationDeliveries]),
    forwardRef(() => OutboundDoModule),
  ],
  controllers: [OutboundIntegrationDeliveriesController],
  providers: [OutboundIntegrationDeliveriesService, OutboundIntegrationDeliveriesRepository],
  exports: [OutboundIntegrationDeliveriesService, OutboundIntegrationDeliveriesRepository],
})
export class OutboundIntegrationDeliveriesModule {}
