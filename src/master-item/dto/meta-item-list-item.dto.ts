import { ApiProperty } from '@nestjs/swagger';

export class MetaItemListItemDto {
  @ApiProperty({ example: 'AST16' })
  item_code: string;

  @ApiProperty({ example: 'RK.AST.160000' })
  item_number: string;

  @ApiProperty({ example: 'AROMA ROYAL TEA 16' })
  item_description: string;

  @ApiProperty({ example: 22001 })
  inventory_item_id: number;

  @ApiProperty({ example: 'JAT' })
  organization_code: string;
}
