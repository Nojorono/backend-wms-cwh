import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PalletUpdateType,
  PalletUpdateStatus,
  InspectionStatus,
} from '../../core/domain/entities/pallet-update.entity';
import { CreatePalletUpdateItemDto } from './create-pallet-update-item.dto';
import { CreatePalletUpdateScanDto } from './create-pallet-update-scan.dto';
import { CreatePalletUpdateAssignedDto } from './create-pallet-update-assigned.dto';

export class CreatePalletUpdateDto {
  @ApiPropertyOptional({ example: 'IPU-2025-0001', description: 'Unique reference number (e.g. IPU-YYYY-NNNN). Generate when creating; required for Split/Merge.' })
  @IsOptional()
  @IsString({ message: 'updateNumber must be a string' })
  @MaxLength(50, { message: 'updateNumber must not exceed 50 characters' })
  updateNumber?: string;

  @ApiProperty({
    enum: PalletUpdateType,
    example: PalletUpdateType.UPDATE_PROD_CODE_UOM,
    description: 'Update type: UPDATE_PROD_CODE_UOM, SPLIT_PALLET, or MERGE_PALLET',
  })
  @IsNotEmpty({ message: 'updateType is required' })
  @IsEnum(PalletUpdateType, { message: 'updateType must be a valid PalletUpdateType' })
  updateType: PalletUpdateType;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString({ message: 'uom must be a string' })
  @MaxLength(50, { message: 'uom must not exceed 50 characters' })
  uom?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'productionCode must be a valid ISO date string' })
  productionCode?: string;

  @ApiPropertyOptional({
    enum: PalletUpdateStatus,
    example: PalletUpdateStatus.COMPLETED,
    default: PalletUpdateStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(PalletUpdateStatus, { message: 'status must be a valid PalletUpdateStatus' })
  status?: PalletUpdateStatus;

  @ApiProperty({ example: 'uuid-user-123', description: 'User who initiated the update' })
  @IsNotEmpty({ message: 'initiatedByUserId is required' })
  @IsUUID(4, { message: 'initiatedByUserId must be a valid UUID' })
  initiatedByUserId: string;

  @ApiPropertyOptional({
    enum: InspectionStatus,
    example: InspectionStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(InspectionStatus, { message: 'inspectionStatus must be a valid InspectionStatus' })
  inspectionStatus?: InspectionStatus;

  @ApiPropertyOptional({ example: 'uuid-user-123', description: 'User who performed the inspection' })
  @IsOptional()
  @IsUUID(4, { message: 'inspectionByUserId must be a valid UUID' })
  inspectionByUserId?: string;

  @ApiPropertyOptional({ example: 'Additional notes about the update' })
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string;

  @ApiPropertyOptional({ example: '2025-01-26T10:00:00.000Z' })
  @IsOptional()
  @IsString({ message: 'completedDate must be a valid ISO date string' })
  completedDate?: string;

  @ApiPropertyOptional({
    type: () => CreatePalletUpdateItemDto,
    example: { sequence: 1, palletId: 'uuid-pallet-123', itemId: 'uuid-item-123', quantity: 10, uom: 'PCS', productionDate: '2025-01-01', weekNumber: 1 },
    description: 'Source pallet item for split operation',
  })
  @IsObject({ message: 'item must be an object' })
  @ValidateNested()
  @Type(() => CreatePalletUpdateItemDto)
  item: CreatePalletUpdateItemDto;

  @ApiPropertyOptional({
    type: () => [CreatePalletUpdateScanDto],
    example:
    {
      scanNumber: 'SCAN-001',
      scanDate: '2025-01-26T10:00:00.000Z',
      scanByUserId: 'uuid-user-123',
      palletId: 'uuid-pallet-123',
      itemId: 'uuid-item-123',
      quantity: 10,
      uom: 'PCS',
      productionDate: '2025-01-01T00:00:00.000Z',
      notes: 'Scan notes',
      weekNumber: 1,
      status: 'PENDING',
    },
  })
  @IsObject({ message: 'scan must be an object' })
  @ValidateNested()
  @Type(() => CreatePalletUpdateScanDto)
  scan: CreatePalletUpdateScanDto;
}
