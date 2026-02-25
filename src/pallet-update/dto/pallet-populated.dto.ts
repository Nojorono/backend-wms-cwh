import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PalletPopulatedDto {
  @ApiProperty({ example: 'uuid-pallet-123' })
  id: string;

  @ApiPropertyOptional({ example: 'PLT-001' })
  pallet_code?: string;

  @ApiPropertyOptional({ example: 'PCS' })
  uom?: string;

  @ApiPropertyOptional({ example: 100 })
  currentQuantity?: number;
}
