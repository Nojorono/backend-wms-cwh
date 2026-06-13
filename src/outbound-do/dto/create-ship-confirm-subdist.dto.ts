import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

/** Input line for subdist ship confirm — quantities only; delivery id/name come from pick release staging. */
export class CreateShipConfirmSubdistLineDto {
  @ApiProperty({
    description: 'Outbound memo item ID (same as pick release source_line_id)',
    format: 'uuid',
  })
  @IsUUID()
  outbound_memo_item_id: string;

  @ApiProperty({
    description: 'Shipped quantity sent to Oracle',
    example: 120,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  shipped_quantity: number;

  // @ApiProperty({
  //   description: 'Delivery ID',
  //   example: 12345,
  // })
  // @IsNumber()
  // @Type(() => Number)
  // delivery_id: number;

  // @ApiProperty({
  //   description: 'Delivery name',
  //   example: 'DEL-001',
  // })
  // @IsString()
  // @MaxLength(150)
  // delivery_name: string;
}

export class CreateShipConfirmSubdistPayloadDto {
  @ApiProperty({ type: [CreateShipConfirmSubdistLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShipConfirmSubdistLineDto)
  lines: CreateShipConfirmSubdistLineDto[];
}
