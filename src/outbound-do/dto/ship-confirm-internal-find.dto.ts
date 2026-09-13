import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ShipConfirmInternalTransactionType } from '../../core/domain/entities/outbound-integration-deliveries.entity';

export class ShipConfirmInternalFindDto {
  @ApiProperty({ example: 'HDR-2026-0001', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  source_header_id?: string;

  @ApiProperty({
    example: 'LINE-2026-0001',
    required: false,
    description: 'Required filter for OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE find.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  source_line_id?: string;

  @ApiProperty({
    example: 'DEL-2026-0001',
    required: false,
    description:
      'Required filter for OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM find (with source_header_id only; no iso_header_id).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  delivery_id?: string;

  @ApiProperty({ example: 12345, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  iso_header_id?: number;

  @ApiProperty({
    enum: ShipConfirmInternalTransactionType,
    required: false,
    example: ShipConfirmInternalTransactionType.OUTBOUND_GS_MUTASI_SO_INTERNAL,
  })
  @IsOptional()
  @IsEnum(ShipConfirmInternalTransactionType)
  transaction_type?: ShipConfirmInternalTransactionType;
}
