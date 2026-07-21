import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InboundIntegration } from 'src/core/domain/entities/inbound-integration.entity';
import { InboundIntegrationLines } from 'src/core/domain/entities/inbound-integration-lines.entity';

export type InboundIntegrationPollStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'INTEGRATED'
  | 'ERROR';

export class InboundIntegrationPollResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: 'INTEGRATED',
    enum: ['PENDING', 'PROCESSING', 'INTEGRATED', 'ERROR'],
  })
  status: InboundIntegrationPollStatus;

  @ApiProperty({ example: 'Oracle terminal status S for source header' })
  message: string;

  @ApiProperty({ example: 'f2e9fcf5-6b81-4b9c-9c85-b6a95d79f725' })
  inbound_do_id: string;

  @ApiProperty({ example: 'bf447ee1-f06f-4d87-967c-709ecee4ad2a' })
  inbound_integration_id: string;

  @ApiPropertyOptional({ example: 'b56da9b0-7822-4cab-bf88-a6bdca3af1fc' })
  source_header_id?: string;

  @ApiPropertyOptional({ example: 12345678 })
  request_id?: number;

  @ApiProperty({ type: InboundIntegration })
  header: InboundIntegration;

  @ApiProperty({ type: [InboundIntegrationLines] })
  lines: InboundIntegrationLines[];
}
