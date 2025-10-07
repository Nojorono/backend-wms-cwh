import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutboundDoStatus, OutboundDoType } from '../../core/domain/entities/outbound-do.entity';

export class OutboundMemoSummaryDto {
  @ApiProperty({ example: 'uuid-memo-123' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  requestor: string;

  @ApiProperty({ example: 'Jakarta' })
  origin: string;

  @ApiProperty({ example: 'PT ABC' })
  ship_to: string;

  @ApiProperty({ example: 'Surabaya' })
  destination: string;

  @ApiProperty({ example: '2025-01-15' })
  delivery_date: Date;

  @ApiProperty({ enum: OutboundDoStatus, example: OutboundDoStatus.PENDING })
  status: OutboundDoStatus;
}

export class OutboundDoResponseDto {
  @ApiProperty({ example: 'uuid-outbound-do-123' })
  id: string;

  @ApiProperty({ example: 'DO-2025-001' })
  outbound_do_number: string;

  @ApiProperty({ example: 'JNE Express' })
  expedition: string;

  @ApiProperty({ example: 'Jakarta' })
  origin: string;

  @ApiProperty({ example: 'B1234ABC' })
  license_plate: string;

  @ApiProperty({ example: 'John Doe' })
  driver_name: string;
  
  @ApiProperty({ example: '081234567890' })
  driver_phone: string;

  @ApiProperty({ enum: OutboundDoStatus, example: OutboundDoStatus.PENDING })
  status: OutboundDoStatus;

  @ApiProperty({ enum: OutboundDoType, example: OutboundDoType.SUBDIST })
  outbound_type: OutboundDoType;

  @ApiProperty({ example: '2025-01-15' })
  delivery_date: Date;

  @ApiProperty({ type: [OutboundMemoSummaryDto] })
  outbound_memos: OutboundMemoSummaryDto[];

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
