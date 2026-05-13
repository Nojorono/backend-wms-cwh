import { PartialType } from '@nestjs/swagger';
import { CreateOutboundIntegrationIrReqDto } from './create-outbound-integration-ir-req.dto';

export class UpdateOutboundIntegrationIrReqDto extends PartialType(CreateOutboundIntegrationIrReqDto) {}
