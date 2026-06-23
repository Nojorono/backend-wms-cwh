import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMoveOrderOracleDto } from './create-move-order-oracle.dto';
import { CreateMoveOrderLineForHeaderDto } from './create-move-order-line-for-header.dto';

export class CreateMoveOrderWithLinesDto extends CreateMoveOrderOracleDto {
  @ApiProperty({
    description: 'Move Order Lines Data -  Array of line objects',
    type: [CreateMoveOrderLineForHeaderDto],
    isArray: true,
    example: [
      {
        LINE_NUMBER: 1,
        ORGANIZATION_ID: 241,
        INVENTORY_ITEM_ID: 21001,
        FROM_SUBINVENTORY_CODE: 'KECIL',
        TO_SUBINVENTORY_CODE: 'CANVAS',
        UOM_CODE: 'BKS',
        QUANTITY: 1000,
        DATE_REQUIRED: '2024-01-01',
        TRANSACTION_TYPE_ID: 121,
        TRANSACTION_SOURCE_TYPE_ID: 4,
        LINE_STATUS: 7,
        STATUS_DATE: '2024-01-01',
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateMoveOrderLineForHeaderDto)
  lines: CreateMoveOrderLineForHeaderDto[];
}
