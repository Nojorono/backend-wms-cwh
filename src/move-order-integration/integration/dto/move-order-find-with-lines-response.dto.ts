import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NormalizedMoveOrderFindData } from '../move-order-find.types';

export class MoveOrderFindWithLinesResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'Move order found' })
  message: string;

  @ApiPropertyOptional({
    description:
      'Normalized Oracle payload: { header, lines }. Raw Oracle may return flat header + LINES[].',
    example: {
      header: { REQUEST_NUMBER: 'SPB/JAT/2026/6/500021.1/5006', HEADER_IFACE_ID: 581113 },
      lines: [{ LINE_NUMBER: 17, INVENTORY_ITEM_ID: 4086 }],
    },
  })
  data?: NormalizedMoveOrderFindData | null;

  @ApiPropertyOptional({ example: 200 })
  statusCode?: number;
}
