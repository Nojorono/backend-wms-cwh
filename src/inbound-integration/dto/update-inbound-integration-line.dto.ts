import { PartialType } from '@nestjs/swagger';
import { CreateInboundIntegrationLineDto } from './create-inbound-integration-line.dto';

export class UpdateInboundIntegrationLineDto extends PartialType(CreateInboundIntegrationLineDto) {}
