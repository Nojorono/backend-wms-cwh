import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MetaItemListDtoByInventoryItemId {
  @ApiProperty({
    description: 'Inventory item ID to filter item list',
    example: 123456,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inventory_item_id: number;

  @ApiProperty({
    description: 'Organization code to filter item list',
    example: 'ORG001',
  })
  @IsNotEmpty()
  @IsString()
  organization_code: string;
}
