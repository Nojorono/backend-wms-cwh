import { PartialType } from '@nestjs/swagger';
import { CreateOutboundDoDto } from './create-outbound-do.dto';
import { OutboundDoStatus } from '../../core/domain/entities/outbound-do.entity';

export class UpdateOutboundDoDto extends PartialType(CreateOutboundDoDto) {
  status?: OutboundDoStatus;
}
