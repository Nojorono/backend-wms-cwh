import { ApiProperty } from '@nestjs/swagger';
import { PickingSuggestionLocationDto } from './picking-suggestion-location.dto';

export class PickingSuggestionDto {
  @ApiProperty({
    description: 'Outbound memo ID',
    example: 'f10e4290-fa5a-4571-9a97-c9eeb7a9fe01',
  })
  memo_id: string;

  @ApiProperty({
    description: 'Item ID',
    example: '7f9f8a1e-5420-48a6-a10a-c85037f9abfa',
  })
  item_id: string;

  @ApiProperty({
    description: 'Item name',
    example: 'CLAS MILD - 16',
  })
  item_name: string;

  @ApiProperty({
    description: 'Item code',
    example: 'RK.CLM.160000',
  })
  item_code: string;

  @ApiProperty({
    description: 'Total required quantity from memo',
    example: 100,
  })
  required_quantity: number;

  @ApiProperty({
    description: 'Quantity already assigned to transaction picking (PENDING + COMPLETED)',
    example: 20,
  })
  already_picked_quantity: number;

  @ApiProperty({
    description: 'Remaining quantity still needed (required - already_picked)',
    example: 80,
  })
  remaining_quantity_needed: number;

  @ApiProperty({
    description: 'Suggested picking locations for this item',
    type: [PickingSuggestionLocationDto],
  })
  suggested_locations: PickingSuggestionLocationDto[];

  @ApiProperty({
    description: 'Total suggested quantity across all locations',
    example: 38,
  })
  total_suggested_quantity: number;

  @ApiProperty({
    description: 'Priority level for picking (lower number = higher priority)',
    example: 5,
  })
  priority: number;

  @ApiProperty({
    description: 'Notes about the picking suggestion',
    example: 'Item tersedia sebagian. Tersedia: 38 DUS, Dibutuhkan: 100 DUS',
  })
  notes: string;
}
