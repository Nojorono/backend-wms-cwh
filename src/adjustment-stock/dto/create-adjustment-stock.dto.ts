import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  AdjustmentStockType,
  AdjustmentStockApprovalStatus,
  AdjustmentStockIsInventory,
} from '../../core/domain/entities/adjustment_stock.entity';
import { CreateAdjustmentStockItemDto } from './create-adjustment-stock-item.dto';

export class CreateAdjustmentStockDto {
  @ApiPropertyOptional({
    example: 'DOC-2025-001',
    description: 'Document reference number',
  })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({
    enum: AdjustmentStockType,
    example: AdjustmentStockType.PHYSICAL_FIT,
    description: 'Type of stock adjustment',
  })
  @IsEnum(AdjustmentStockType)
  type: AdjustmentStockType;

  @ApiPropertyOptional({
    example: 'ADJ-2025-0001',
    description: 'Adjustment code (auto-generated if not provided)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiPropertyOptional({
    example: 'Physical count adjustment',
    description: 'Notes about the adjustment',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    enum: AdjustmentStockApprovalStatus,
    example: AdjustmentStockApprovalStatus.PENDING,
    description: 'Approval status',
    default: AdjustmentStockApprovalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(AdjustmentStockApprovalStatus)
  status?: AdjustmentStockApprovalStatus;

  @ApiPropertyOptional({
    enum: AdjustmentStockIsInventory,
    example: AdjustmentStockIsInventory.GOOD_STOCK,
    description: 'Inventory type (good or bad stock)',
  })
  @IsOptional()
  @IsEnum(AdjustmentStockIsInventory)
  is_inventory?: AdjustmentStockIsInventory;

  @ApiProperty({
    type: [CreateAdjustmentStockItemDto],
    description: 'Adjustment line items (at least one required)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateAdjustmentStockItemDto)
  items: CreateAdjustmentStockItemDto[];
}
