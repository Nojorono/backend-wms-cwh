import { PartialType } from '@nestjs/swagger';
import { CreateInboundDto, CreateInboundDoDto, CreateInboundItemDto } from './create-inbound.dto';

export class UpdateInboundItemDto extends PartialType(CreateInboundItemDto) {}
export class UpdateInboundDoDto extends PartialType(CreateInboundDoDto) {}
export class UpdateInboundDto extends PartialType(CreateInboundDto) {}


