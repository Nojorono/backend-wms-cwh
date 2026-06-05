import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';
import { ShipConfirmInternalTransactionType } from 'src/core/domain/entities/outbound-integration-deliveries.entity';

/** Oracle `shipconfirm.create` payload for subdist ship confirm — six fields only. */
export class CreateShipConfirmSubdistOracleDto {
  @ApiProperty({
    enum: ShipConfirmInternalTransactionType,
    example: ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM,
  })
  @IsEnum(ShipConfirmInternalTransactionType)
  TRANSACTION_TYPE: ShipConfirmInternalTransactionType;

  @ApiProperty({ example: 'WMS' })
  @IsString()
  @MaxLength(100)
  SOURCE_SYSTEM: string;

  @ApiProperty({ example: 'memo-uuid' })
  @IsString()
  @MaxLength(100)
  SOURCE_HEADER_ID: string;

  @ApiProperty({ example: 12345 })
  @IsNotEmpty()
  @IsNumber()
  DELIVERY_ID: number;

  @ApiProperty({ example: 'DEL-001' })
  @IsString()
  @MaxLength(150)
  DELIVERY_NAME: string;

  @ApiProperty({ example: 120 })
  @IsNotEmpty()
  @IsNumber()
  SHIPPED_QUANTITY: number;
}
