import { ApiProperty } from '@nestjs/swagger';
import { MasterItem } from '../../core/domain/entities/master-item.entity';

export class FindByBranchResponseDto {
  @ApiProperty({
    description: 'Master items that match the sales items',
    type: [MasterItem],
  })
  masterItems: MasterItem[];

  @ApiProperty({
    description: 'Sales items that do not have a matching master item',
    type: 'array',
    example: [
      {
        item_code: 'AST16',
        organization_id: 111,
        organization_code: 'JAT',
        primary_unit_of_measure: 'Bungkus',
        last_update_date: '2025-02-03T09:03:35.000Z',
      },
    ],
  })
  unmatchedSalesItems: any[];

  @ApiProperty({ description: 'Total count of sales items from Oracle' })
  salesItemCount: number;

  @ApiProperty({ description: 'Total count of master items found' })
  masterItemCount: number;

  @ApiProperty({ description: 'Total count of unmatched sales items' })
  unmatchedSalesItemCount: number;
}
