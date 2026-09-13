import { ApiProperty } from '@nestjs/swagger';
import { OutboundIntegrationIrReqHeaderWithLines } from '../outbound-integration-ir-req.service';

export class PollIntegrationMemoStatusDto {
  @ApiProperty({ format: 'uuid' })
  outbound_memo_id: string;

  @ApiProperty({ enum: ['SUCCESS', 'ERROR', 'PENDING'] })
  status: 'SUCCESS' | 'ERROR' | 'PENDING';

  @ApiProperty()
  reason: string;
}

export class PollIntegrationStatusResponseDto {
  @ApiProperty({ enum: ['SUCCESS', 'ERROR', 'PENDING'] })
  status: 'SUCCESS' | 'ERROR' | 'PENDING';

  @ApiProperty()
  reason: string;

  @ApiProperty({ format: 'uuid' })
  outbound_do_id: string;

  @ApiProperty({ type: [PollIntegrationMemoStatusDto] })
  memos: PollIntegrationMemoStatusDto[];

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  outbound_integration_ir_req: OutboundIntegrationIrReqHeaderWithLines[];
}
