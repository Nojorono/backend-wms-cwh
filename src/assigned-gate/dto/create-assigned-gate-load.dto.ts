import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { AssignedGateLoadStatus } from '../../core/domain/entities/assigned-gate-load.entity';

export class CreateAssignedGateLoadDto {
    @ApiPropertyOptional({
        description: 'Assigned Gate ID',
        example: 'uuid-assigned-gate-123',
    })
    @IsOptional()
    @IsString()
    assigned_gate_id?: string;

    @ApiPropertyOptional({
        description: 'Outbound DO ID',
        example: 'uuid-outbound-do-123',
    })
    @IsOptional()
    @IsString()
    outbound_do_id?: string;

    @ApiPropertyOptional({
        description: 'Outbound Memo ID',
        example: 'uuid-outbound-memo-123',
    })
    @IsOptional()
    @IsString()
    outbound_memo_id?: string;

    @ApiProperty({
        description: 'Pallet ID',
        example: 'uuid-pallet-123',
    })
    @IsString()
    pallet_id: string;

    @ApiProperty({
        description: 'Item ID',
        example: 'uuid-item-123',
    })
    @IsString()
    item_id: string;

    @ApiPropertyOptional({
        description: 'Unit of Measure',
        example: 'DUS',
    })
    @IsOptional()
    @IsString()
    uom?: string;

    @ApiPropertyOptional({
        description: 'Quantity Picked',
        example: 100,
    })
    @IsOptional()
    @IsNumber()
    quantity_picked?: number;

    @ApiPropertyOptional({
        description: 'Quantity Loaded',
        example: 0,
    })
    @IsOptional()
    @IsNumber()
    quantity_loaded?: number;

    @ApiPropertyOptional({
        description: 'Quantity Unloaded',
        example: 0,
    })
    @IsOptional()
    @IsNumber()
    quantity_unloaded?: number;

    @ApiPropertyOptional({
        description: 'Status of the assigned gate load',
        enum: AssignedGateLoadStatus,
        example: AssignedGateLoadStatus.PENDING,
    })
    @IsOptional()
    @IsEnum(AssignedGateLoadStatus)
    status?: AssignedGateLoadStatus;
}

