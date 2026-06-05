import { PartialType } from '@nestjs/swagger';
import { CreateOutboundIntegrationIrReqLineDto } from './create-outbound-integration-ir-req-line.dto';

export class UpdateOutboundIntegrationIrReqLineDto extends PartialType(
  CreateOutboundIntegrationIrReqLineDto,
) {}
