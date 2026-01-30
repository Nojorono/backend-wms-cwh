import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsEnum,
    IsNotEmpty,
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

export class CreateMergePalletDto {
    @ApiPropertyOptional({ example: 'IPU-2025-0001', description: 'Unique reference number (e.g. IPU-YYYY-NNNN). Generate when creating; required for Split/Merge.' })
    @IsOptional()
    @IsString({ message: 'updateNumber must be a string' })
    @MaxLength(50, { message: 'updateNumber must not exceed 50 characters' })
    updateNumber?: string;

    @ApiProperty({
        enum: PalletUpdateType,
        example: PalletUpdateType.MERGE_PALLET,
        description: 'Update type: MERGE_PALLET',
    })
    @IsNotEmpty({ message: 'updateType is required' })
    @IsEnum(PalletUpdateType, { message: 'updateType must be a valid PalletUpdateType' })
    updateType: PalletUpdateType.MERGE_PALLET;

    @ApiPropertyOptional({
        enum: PalletUpdateStatus,
        example: PalletUpdateStatus.PENDING_HELPER_ACTION,
        default: PalletUpdateStatus.PENDING_HELPER_ACTION,
    })
    @IsOptional()
    @IsEnum(PalletUpdateStatus, { message: 'status must be a valid PalletUpdateStatus' })
    status?: PalletUpdateStatus.PENDING_HELPER_ACTION;

    @ApiProperty({ example: 'uuid-user-123', description: 'User who initiated the update' })
    @IsNotEmpty({ message: 'initiatedByUserId is required' })
    @IsUUID(4, { message: 'initiatedByUserId must be a valid UUID' })
    initiatedByUserId: string;

    @ApiPropertyOptional({
        enum: InspectionStatus,
        example: InspectionStatus.PENDING,
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
        type: () => [CreatePalletUpdateItemDto],
        example: [
            { sequence: 1, palletId: 'uuid-pallet-123', itemId: 'uuid-item-123' },
            { sequence: 2, palletId: 'uuid-pallet-456', itemId: 'uuid-item-456' },
        ],
    })
    @IsOptional()
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => CreatePalletUpdateItemDto)
    items?: CreatePalletUpdateItemDto[];

    @ApiPropertyOptional({
        type: () => [CreatePalletUpdateAssignedDto],
        example: [
            {
                userId: 'uuid-user-123',
                assignedAt: '2025-01-26T10:00:00.000Z',
            },
        ],
    })
    @IsOptional()
    @IsArray({ message: 'assigned must be an array' })
    @ValidateNested({ each: true })
    @Type(() => CreatePalletUpdateAssignedDto)
    assigned?: CreatePalletUpdateAssignedDto[];
}
