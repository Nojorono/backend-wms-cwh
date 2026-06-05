import { PartialType } from '@nestjs/swagger';
import { CreateOutboundIntegrationDeliveriesDto } from './create-outbound-integration-deliveries.dto';

export class UpdateOutboundIntegrationDeliveriesDto extends PartialType(
  CreateOutboundIntegrationDeliveriesDto,
) {}
