import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateShipConfirmSubdistDto {
  @ApiProperty({
    description: 'Transaction type',
    example: 'OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  transaction_type: string;

  @ApiProperty({
    description: 'Source system',
    example: 'WMS',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  source_system: string;

  @ApiProperty({
    description: 'Source header ID',
    example: '100000231',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  source_header_id: string;

  @ApiProperty({
    description: 'Oracle delivery ID',
    example: 981234,
  })
  @IsNumber()
  delivery_id: number;

  @ApiProperty({
    description: 'Oracle delivery name',
    example: 'DEL-0001',
    maxLength: 30,
  })
  @IsString()
  @MaxLength(30)
  delivery_name: string;

  @ApiProperty({
    description: 'Shipped quantity',
    example: 120,
  })
  @IsNumber()
  shipped_quantity: number;
}
