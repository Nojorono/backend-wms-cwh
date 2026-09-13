import {
    IsDateString,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryTrackingBadDto {
    @ApiProperty({ example: 'uuid-inbound-retur-123', description: 'Inbound retur ID' })
    @IsUUID()
    inbound_retur_id: string;

    @ApiProperty({ example: 'uuid-inventory-tracking-123', description: 'Inventory tracking ID' })
    @IsUUID()
    inventory_tracking_id: string;

    @ApiProperty({ example: 'uuid-item-123', description: 'Master item ID' })
    @IsUUID()
    item_id: string;

    @ApiProperty({ example: 10, description: 'Quantity' })
    @IsNumber()
    @Min(0)
    quantity: number;

    @ApiPropertyOptional({ example: 'PCS', description: 'Unit of measure' })
    @IsOptional()
    @IsString()
    uom?: string;

    @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', description: 'Production date' })
    @IsOptional()
    @IsDateString()
    production_date?: string;

    @ApiPropertyOptional({ example: 2025, description: 'Year' })
    @IsOptional()
    @IsNumber()
    @Min(2000)
    year?: number;

    @ApiPropertyOptional({ example: 'HJE-001', description: 'HJE code' })
    @IsOptional()
    @IsString()
    hje?: string;

    @ApiPropertyOptional({ example: 'Notes for bad inventory', description: 'Additional notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}
