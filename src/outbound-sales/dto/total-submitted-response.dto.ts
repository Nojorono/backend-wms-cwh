import { ApiProperty } from '@nestjs/swagger';
import { DoSuggestionStatus } from '../../core/domain/entities/do-suggestion.entity';

export class TotalSubmittedItemDto {
  @ApiProperty({ example: 'ABC12' })
  item_code: string;

  @ApiProperty({
    example: 120,
    description: 'Sum of item_qty_submitted for this item (SUBMITTED status only)',
  })
  total_submitted: number;
}

export class TotalSubmittedResponseDto {
  @ApiProperty({ example: 'uuid-organization-id' })
  organization_id: string;

  @ApiProperty({ example: '2026-06-19' })
  date: string;

  @ApiProperty({ enum: DoSuggestionStatus, example: DoSuggestionStatus.SUBMITTED })
  status: DoSuggestionStatus;

  @ApiProperty({ type: [TotalSubmittedItemDto] })
  items: TotalSubmittedItemDto[];

  @ApiProperty({
    example: 350,
    description: 'Sum of total_submitted across all items',
  })
  grand_total: number;
}
