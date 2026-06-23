import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoveOrderFindWithLinesResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'Move order found' })
  message: string;

  @ApiPropertyOptional({
    description: 'Oracle header and lines (uppercase keys)',
    example: {
      header: { REQUEST_NUMBER: 'JAT/SPB/2024/01/000002', HEADER_IFACE_ID: 123 },
      lines: [{ LINE_NUMBER: 1, INVENTORY_ITEM_ID: 21001 }],
    },
  })
  data?: {
    header?: Record<string, unknown>;
    lines?: Record<string, unknown>[];
  } | null;

  @ApiPropertyOptional({ example: 200 })
  statusCode?: number;
}
