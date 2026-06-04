import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutboundIntegrationDeliveries } from '../../core/domain/entities/outbound-integration-deliveries.entity';

export class PollShipConfirmSourceHeaderStatusDto {
  @ApiProperty()
  source_header_id: string;

  @ApiPropertyOptional({ format: 'uuid' })
  outbound_memo_id?: string;

  @ApiProperty({ enum: ['SUCCESS', 'ERROR', 'PENDING'] })
  status: 'SUCCESS' | 'ERROR' | 'PENDING';

  @ApiProperty()
  reason: string;

  @ApiProperty()
  delivery_count: number;
}

export class PollShipConfirmStatusResponseDto {
  @ApiProperty({ enum: ['SUCCESS', 'ERROR', 'PENDING'] })
  status: 'SUCCESS' | 'ERROR' | 'PENDING';

  @ApiProperty()
  reason: string;

  @ApiProperty({ format: 'uuid' })
  outbound_do_id: string;

  @ApiProperty()
  deliveries_updated: number;

  @ApiProperty()
  has_error: boolean;

  @ApiProperty({ type: [PollShipConfirmSourceHeaderStatusDto] })
  source_headers: PollShipConfirmSourceHeaderStatusDto[];

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  outbound_integration_deliveries: OutboundIntegrationDeliveries[];
}
