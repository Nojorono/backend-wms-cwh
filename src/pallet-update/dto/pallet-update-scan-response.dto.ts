import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PalletPopulatedDto } from './pallet-populated.dto';

export class PalletUpdateScanResponseDto {
  @ApiProperty({ example: 'uuid-scan-123' })
  id: string;

  @ApiProperty({ example: 'uuid-pallet-update-123' })
  palletUpdateId: string;

  @ApiPropertyOptional({ example: 'SCAN-001' })
  scanNumber?: string;

  @ApiPropertyOptional({ example: '2025-01-26T10:00:00.000Z' })
  scanDate?: Date;

  @ApiPropertyOptional({ example: 'uuid-user-123' })
  scanByUserId?: string;

  @ApiPropertyOptional({ example: 'uuid-pallet-123' })
  palletId?: string;

  @ApiPropertyOptional({ description: 'Populated pallet details', type: PalletPopulatedDto })
  pallet?: PalletPopulatedDto;

  @ApiPropertyOptional({ example: 'uuid-item-123' })
  itemId?: string;

  @ApiPropertyOptional({ example: 10 })
  quantity?: number;

  @ApiPropertyOptional({ example: 'PCS' })
  uom?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  productionDate?: Date;

  @ApiPropertyOptional({ example: 'Additional notes about the scan' })
  notes?: string;

  @ApiPropertyOptional({ example: 'PENDING' })
  status?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
