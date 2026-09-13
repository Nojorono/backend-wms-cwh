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

/** Per-row find key used by the polling process (mirrors shipconfirm.find payload). */
export class PollShipConfirmFindKeyStatusDto {
  @ApiProperty({ format: 'uuid' })
  delivery_row_id: string;

  @ApiPropertyOptional()
  source_header_id?: string;

  @ApiPropertyOptional({
    description: 'Find key for OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE',
  })
  source_line_id?: string;

  @ApiPropertyOptional({
    description: 'Find key for OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM',
  })
  delivery_id?: string;

  @ApiPropertyOptional()
  iso_header_id?: number;

  @ApiProperty({ enum: ['SUCCESS', 'ERROR', 'PENDING', 'SKIPPED'] })
  status: 'SUCCESS' | 'ERROR' | 'PENDING' | 'SKIPPED';

  @ApiProperty()
  reason: string;
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

  @ApiProperty({
    type: [PollShipConfirmFindKeyStatusDto],
    description:
      'Per-row find process summary: PICK_RELEASE uses source_line_id; SHIP_CONFIRM uses delivery_id.',
  })
  find_keys: PollShipConfirmFindKeyStatusDto[];

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  outbound_integration_deliveries: OutboundIntegrationDeliveries[];
}
