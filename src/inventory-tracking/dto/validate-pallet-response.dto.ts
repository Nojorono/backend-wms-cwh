import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PalletStatusDto {
  @ApiProperty({ example: true })
  exists: boolean;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: false })
  is_full: boolean;

  @ApiProperty({ example: 0 })
  current_quantity: number;

  @ApiProperty({ example: 100 })
  capacity: number;
}

export class PalletItemDto {
  @ApiProperty({ example: 'uuid-item-123' })
  item_id: string;

  @ApiProperty({ example: 'JAZY-KRETEK' })
  item_name: string;

  @ApiProperty({ example: 50 })
  current_quantity: number;

  @ApiProperty({ example: 'PCS' })
  uom: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  production_date?: string;

  @ApiProperty({ example: 1 })
  week_number: number;

  @ApiProperty({ example: 'READY' })
  status_inventory: string;
}

export class ValidatePalletDataDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Pallet dapat digunakan untuk inventory tracking.' })
  message: string;

  @ApiProperty({ example: 'PAL-001' })
  pallet_code: string;

  @ApiProperty({ example: 'pallet-uuid' })
  pallet_id: string | null;

  @ApiProperty({ example: true })
  is_available: boolean;

  @ApiProperty({ example: true })
  can_use: boolean;

  @ApiProperty({ type: PalletStatusDto })
  pallet_status: PalletStatusDto;

  @ApiPropertyOptional({ type: Object, nullable: true })
  existing_tracking?: any;

  @ApiProperty({ example: true })
  can_create: boolean;

  @ApiProperty({ type: [String], example: [] })
  reasons: string[];

  @ApiProperty({ type: [PalletItemDto], example: [] })
  items: PalletItemDto[];
}

export class ValidatePalletResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty({ type: ValidatePalletDataDto })
  data: ValidatePalletDataDto;

  @ApiProperty({ example: '2025-10-15T03:01:44.715Z' })
  timestamp: string;

  @ApiProperty({ example: '/inventory-tracking/validate-pallet/PAL-001' })
  path: string;
}

export class ValidatePalletErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({
    example: 'Pallet tidak dapat digunakan: Pallet tidak aktif, Pallet sudah penuh',
  })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ type: ValidatePalletDataDto })
  data: ValidatePalletDataDto;
}
