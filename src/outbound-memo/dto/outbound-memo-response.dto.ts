import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OutboundMemoStatus } from '../../core/domain/entities/outbound-memo.entity';

export class OutboundMemoItemResponseDto {
  @ApiProperty({ example: 'uuid-item-123' })
  item_id: string;

  @ApiProperty({ example: 'Item Name' })
  item_name?: string;

  @ApiProperty({ example: 100 })
  quantity_plan: number;

  @ApiPropertyOptional({ example: 'PCS' })
  uom?: string;
}

export class OutboundMemoResponseDto {
  @ApiProperty({ example: 'uuid-outbound-memo-123' })
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

  @ApiProperty({ enum: OutboundMemoStatus, example: OutboundMemoStatus.PENDING })
  status: OutboundMemoStatus;

  @ApiPropertyOptional({ example: 'Catatan pengiriman' })
  notes?: string;

  @ApiProperty({ type: [OutboundMemoItemResponseDto] })
  outbound_memo_items: OutboundMemoItemResponseDto[];

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
