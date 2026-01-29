import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInboundReturItemDto {
  @ApiProperty({ example: 'uuid-item-1' })
  @IsString()
  @IsUUID(4, { message: 'item_id must be a valid UUID' })
  item_id: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 'uuid-classification-1' })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'classification_id must be a valid UUID' })
  classification_id?: string;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  uom?: string;
}
