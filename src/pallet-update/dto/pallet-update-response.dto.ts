import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PalletUpdateType,
  PalletUpdateStatus,
  InspectionStatus,
} from '../../core/domain/entities/pallet-update.entity';
import { PalletUpdateScanResponseDto } from './pallet-update-scan-response.dto';

export class PalletUpdateItemResponseDto {
  @ApiProperty({ example: 'uuid-item-123' })
  id: string;

  @ApiProperty({ example: 'uuid-pallet-update-123' })
  palletUpdateId: string;

  @ApiPropertyOptional({ example: 1 })
  sequence?: number;

  @ApiPropertyOptional({ example: 'uuid-pallet-123' })
  palletId?: string;

  @ApiPropertyOptional({ example: 'uuid-item-123' })
  itemId?: string;

  @ApiPropertyOptional({ example: 10 })
  quantity?: number;

  @ApiPropertyOptional({ example: 'PCS' })
  uom?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  productionDate?: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class PalletUpdateAssignedResponseDto {
  @ApiProperty({ example: 'uuid-assigned-123' })
  id: string;

  @ApiProperty({ example: 'uuid-pallet-update-123' })
  palletUpdateId: string;

  @ApiProperty({ example: 'uuid-user-123' })
  userId: string;

  @ApiProperty({ example: '2025-01-26T10:00:00.000Z' })
  assignedAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class PalletUpdateResponseDto {
  @ApiProperty({ example: 'uuid-pallet-update-123' })
  id: string;

  @ApiPropertyOptional({ example: 'IPU-2025-0001' })
  updateNumber?: string;

  @ApiProperty({ enum: PalletUpdateType, example: PalletUpdateType.UPDATE_PROD_CODE_UOM })
  updateType: PalletUpdateType;

  @ApiPropertyOptional({ example: 'PCS' })
  uom?: string;

  @ApiPropertyOptional({ example: 'PROD-001' })
  productionCode?: string;

  @ApiProperty({ enum: PalletUpdateStatus, example: PalletUpdateStatus.PENDING_ASSIGNMENT })
  status: PalletUpdateStatus;

  @ApiProperty({ example: 'uuid-user-123' })
  initiatedByUserId: string;

  @ApiPropertyOptional({ enum: InspectionStatus, example: InspectionStatus.PENDING })
  inspectionStatus?: InspectionStatus;

  @ApiPropertyOptional({ example: 'uuid-user-123' })
  inspectionByUserId?: string;

  @ApiPropertyOptional({ example: 'Additional notes' })
  notes?: string;

  @ApiPropertyOptional({ example: '2025-01-26T10:00:00.000Z' })
  completedDate?: Date;

  @ApiPropertyOptional({ type: [PalletUpdateItemResponseDto] })
  items?: PalletUpdateItemResponseDto[];

  @ApiPropertyOptional({ type: [PalletUpdateScanResponseDto] })
  scans?: PalletUpdateScanResponseDto[];

  @ApiPropertyOptional({ type: [PalletUpdateAssignedResponseDto] })
  assigned?: PalletUpdateAssignedResponseDto[];

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
