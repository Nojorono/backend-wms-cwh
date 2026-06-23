import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateMoveOrderWithLinesDto } from './create-move-order-with-lines.dto';

export class MoveOrderCreateDataRowDto {
  @ApiPropertyOptional({ example: '1234567890' })
  SOURCE_HEADER_ID?: string;

  @ApiPropertyOptional({ example: 'JAT/SPB/2024/01/000002' })
  REQUEST_NUMBER?: string;

  @ApiPropertyOptional({ example: 987654321 })
  HEADER_IFACE_ID?: number;

  @ApiPropertyOptional({ example: 1 })
  TOTAL_LINES?: number;

  @ApiPropertyOptional({ example: 1 })
  INSERTED_LINES?: number;
}

export class MoveOrderWithLinesResponseDto {
  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'Move order created successfully' })
  message: string;

  @ApiPropertyOptional({ type: MoveOrderCreateDataRowDto })
  data?: MoveOrderCreateDataRowDto | MoveOrderCreateDataRowDto[] | null;

  @ApiPropertyOptional({ example: 200 })
  statusCode?: number;
}

export type MoveOrderCreateWithLinesRmqPayload = {
  createDto: CreateMoveOrderWithLinesDto;
  userId?: number;
  userName?: string;
};
