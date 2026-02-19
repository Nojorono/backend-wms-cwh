import { IsString, IsEnum, IsNumber, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AdjustmentStockType,
  AdjustmentStockApprovalStatus,
  AdjustmentStockIsInventory,
} from '../../core/domain/entities/adjustment_stock.entity';

export class CreateAdjustmentStockDto {
  @ApiPropertyOptional({ 
    example: 'DOC-2025-001', 
    description: 'Document reference number',
    maxLength: 255 
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  document?: string;

  @ApiProperty({ 
    enum: AdjustmentStockType,
    example: AdjustmentStockType.PHYSICAL_FIT, 
    description: 'Type of stock adjustment'
  })
  @IsEnum(AdjustmentStockType)
  type: AdjustmentStockType;

  @ApiPropertyOptional({ 
    example: 'ADJ-2025-001', 
    description: 'Adjustment code',
    maxLength: 255 
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @ApiProperty({ 
    example: 'uuid-pallet-123', 
    description: 'Pallet ID'
  })
  @IsUUID(4, { message: 'pallet_id must be a valid UUID' })
  pallet_id: string;

  @ApiProperty({ 
    example: 'uuid-item-123', 
    description: 'Item ID'
  })
  @IsUUID(4, { message: 'item_id must be a valid UUID' })
  item_id: string;

  @ApiProperty({ 
    example: 100, 
    description: 'Quantity to adjust'
  })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ 
    example: 'PCS', 
    description: 'Unit of measure',
    maxLength: 50 
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  uom?: string;

  @ApiPropertyOptional({ 
    example: 'Physical count adjustment', 
    description: 'Notes about the adjustment',
    maxLength: 1000 
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ 
    enum: AdjustmentStockApprovalStatus,
    example: AdjustmentStockApprovalStatus.PENDING, 
    description: 'Approval status',
    default: AdjustmentStockApprovalStatus.PENDING
  })
  @IsOptional()
  @IsEnum(AdjustmentStockApprovalStatus)
  status?: AdjustmentStockApprovalStatus;

  @ApiPropertyOptional({ 
    enum: AdjustmentStockIsInventory,
    example: AdjustmentStockIsInventory.GOOD_STOCK, 
    description: 'Inventory type (good or bad stock)'
  })
  @IsOptional()
  @IsEnum(AdjustmentStockIsInventory)
  is_inventory?: AdjustmentStockIsInventory;
}
