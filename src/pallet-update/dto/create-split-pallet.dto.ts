import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
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
import { CreatePalletUpdateAssignedDto } from './create-pallet-update-assigned.dto';

export class CreateSplitPalletDto {
    @ApiPropertyOptional({ example: 'uuid-organization-123' })
    @IsOptional()
    @IsUUID(4, { message: 'organization_id must be a valid UUID' })
    organization_id?: string;

    @ApiPropertyOptional({ example: 'IPU-2025-0001', description: 'Unique reference number (e.g. IPU-YYYY-NNNN). Generate when creating; required for Split/Merge.' })
    @IsOptional()
    @IsString({ message: 'updateNumber must be a string' })
    @MaxLength(50, { message: 'updateNumber must not exceed 50 characters' })
    updateNumber?: string;

    @ApiProperty({
        enum: PalletUpdateType,
        example: PalletUpdateType.SPLIT_PALLET,
        description: 'Update type: SPLIT_PALLET',
    })
    @IsNotEmpty({ message: 'updateType is required' })
    @IsEnum(PalletUpdateType, { message: 'updateType must be a valid PalletUpdateType' })
    updateType: PalletUpdateType.SPLIT_PALLET;

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
        type: () => CreatePalletUpdateItemDto,
        example: { sequence: 1, palletId: 'uuid-pallet-123', itemId: 'uuid-item-123', quantity: 10, uom: 'PCS', productionDate: '2025-01-01', weekNumber: 1 },
        description: 'Source pallet item for split operation',
    })
    @IsOptional()
    @IsObject({ message: 'item must be an object' })
    @ValidateNested()
    @Type(() => CreatePalletUpdateItemDto)
    item?: CreatePalletUpdateItemDto;

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
