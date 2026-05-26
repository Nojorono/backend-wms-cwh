import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  DeliveryAttributeCategory,
  ShipConfirmInternalTransactionType,
} from 'src/core/domain/entities/outbound-integration-deliveries.entity';

export class CreateShipConfirmInternalDto {
  @ApiProperty({
    enum: ShipConfirmInternalTransactionType,
    example: ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL,
  })
  @IsEnum(ShipConfirmInternalTransactionType)
  TRANSACTION_TYPE: ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL;

  @ApiProperty({ example: 'WMS' })
  @IsString()
  @MaxLength(100)
  SOURCE_SYSTEM: string;

  @ApiProperty({ example: 'HDR-2026-0001' })
  @IsString()
  @MaxLength(100)
  SOURCE_HEADER_ID: string;

  @ApiProperty({ example: 12345, required: false })
  @IsNotEmpty()
  @IsNumber()
  ISO_HEADER_ID?: number;

  @ApiProperty({
    enum: DeliveryAttributeCategory,
    example: DeliveryAttributeCategory.EKSPEDISI_EKSTERNAL,
    description:
      'Ekspedisi Eksternal | Ekspedisi Internal | Ekspedisi Vendor',
    required: false,
  })
  @IsOptional()
  @IsEnum(DeliveryAttributeCategory)
  DELIVERY_ATTRIBUTE_CATEGORY?: DeliveryAttributeCategory;

  @ApiPropertyOptional({ description: 'Nama Ekspedisi' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE6?: string;

  @ApiPropertyOptional({ description: 'Nama Driver' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE7?: string;

  @ApiPropertyOptional({ description: 'Nomor Kendaraan' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE8?: string;

  @ApiPropertyOptional({ description: 'Nomor Segel' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE9?: string;

  @ApiPropertyOptional({ description: 'PO Line Expedisi' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE10?: string;

  @ApiPropertyOptional({ description: 'Jenis Kendaraan' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE11?: string;

  @ApiPropertyOptional({ description: 'Nomor Kontainer' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE12?: string;

  @ApiPropertyOptional({ description: 'ETA' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE13?: string;

  @ApiPropertyOptional({ description: 'Quantity Utilitas (%)' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE14?: string;

  @ApiPropertyOptional({ description: 'Jenis Perhitungan' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  DELIVERY_ATTRIBUTE15?: string;
}
