import { PartialType } from '@nestjs/swagger';
import { CreateInboundIntegrationDto } from './create-inbound-integration.dto';

export class UpdateInboundIntegrationDto extends PartialType(CreateInboundIntegrationDto) {}
