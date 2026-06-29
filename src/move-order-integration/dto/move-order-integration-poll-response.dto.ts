import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MoveOrderIntegration } from '../../core/domain/entities/move-order-integration.entity';
import { MoveOrderLineIntegration } from '../../core/domain/entities/move-order-integration-lines.entity';

export type MoveOrderIntegrationPollStatus =
  | 'READY'
  | 'PROCESSING'
  | 'INTEGRATED'
  | 'ERROR'
  | 'TIMEOUT'
  | 'PENDING';

export class MoveOrderIntegrationPollResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: 'INTEGRATED',
    enum: ['READY', 'PROCESSING', 'INTEGRATED', 'ERROR', 'TIMEOUT', 'PENDING'],
  })
  status: MoveOrderIntegrationPollStatus;

  @ApiProperty({ example: 'Oracle move order integrated' })
  message: string;

  @ApiProperty({ example: 'bf447ee1-f06f-4d87-967c-709ecee4ad2a' })
  move_order_integration_id: string;

  @ApiPropertyOptional({ example: 'b56da9b0-7822-4cab-bf88-a6bdca3af1fc' })
  source_header_id?: string;

  @ApiPropertyOptional({ example: 'SPB/JAT/2026/6/500021.1/5001' })
  request_number?: string;

  @ApiProperty({ type: MoveOrderIntegration })
  header: Omit<MoveOrderIntegration, 'lines'>;

  @ApiProperty({ type: [MoveOrderLineIntegration] })
  lines: MoveOrderLineIntegration[];
}
