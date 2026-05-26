import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShipConfirmPickReleaseLineDto {
  @ApiProperty({ example: 'line-uuid-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  SOURCE_LINE_ID: string;

  @ApiProperty({ example: 1001 })
  @IsNumber()
  @IsNotEmpty()
  ISO_LINE_ID: number;

  @ApiPropertyOptional({ example: 847002 })
  @IsOptional()
  @IsNumber()
  ISO_INVENTORY_ITEM_ID?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  SHIPPED_QUANTITY?: number;
}
