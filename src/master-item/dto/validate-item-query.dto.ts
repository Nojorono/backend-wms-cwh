import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** HTTP query DTO for validate-item endpoint (independent from meta RMQ payload). */
export class ValidateItemQueryDto {
  @ApiProperty({
    description: 'Organization code to filter by',
    example: 'ORG001',
  })
  @IsNotEmpty()
  @IsString()
  organization_code: string;

  @ApiProperty({
    description: 'Inventory item ID to filter by',
    example: 123456,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inventory_item_id: number;
}
