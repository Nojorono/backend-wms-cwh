import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShipConfirmPickReleaseLineDto {
  @ApiProperty({ example: 'LINE-2026-0001' })
  @IsString()
  @MaxLength(100)
  SOURCE_LINE_ID: string;

  @ApiProperty({ example: 12345 })
  @IsNumber()
  ISO_HEADER_ID: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  ISO_LINE_ID: number;

  @ApiProperty({ example: 987654 })
  @IsNumber()
  ISO_INVENTORY_ITEM_ID: number;

  @ApiProperty({ example: 204 })
  @IsNumber()
  ISO_ORGANIZATION_ID: number;

  @ApiPropertyOptional({ example: 50001, description: 'Type 3: Outbound GS SO Subdist Ship Confirm' })
  @IsOptional()
  @IsNumber()
  DELIVERY_ID?: number;

  @ApiPropertyOptional({ example: 'DEL-2026-0001' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  DELIVERY_NAME?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  SHIPPED_QUANTITY?: number;
}
