import { PartialType } from '@nestjs/swagger';
import { CreateOutboundMemoDto } from './create-outbound-memo.dto';
import { OutboundMemoStatus } from '../../core/domain/entities/outbound-memo.entity';

export class UpdateOutboundMemoDto extends PartialType(CreateOutboundMemoDto) {
  status?: OutboundMemoStatus;
}
