import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { DoSuggestionStatus } from '../../core/domain/entities/do-suggestion.entity';

export class DoDmsDetailDto {
    @ApiProperty({ example: 'ITEM-001' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    item_code: string;

    @ApiProperty({ example: 100 })
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    inventory_item_id: number;

    @ApiProperty({ example: 100 })
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    item_qty_suggestion: number;

    // @ApiPropertyOptional({ example: 90 })
    // @IsOptional()
    // @Type(() => Number)
    // @IsInt()
    // item_qty_revision?: number;

    // @ApiPropertyOptional({ example: 90 })
    // @IsOptional()
    // @Type(() => Number)
    // @IsInt()
    // item_qty_submitted?: number;

    // @ApiPropertyOptional({ example: 90 })
    // @IsOptional()
    // @Type(() => Number)
    // @IsInt()
    // item_qty_final?: number;

    @ApiProperty({ example: 12.5 })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    contribution_percentage: number;

    @ApiProperty({ example: 'PCS' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    item_uom: string;

    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    line_number: number;
}


export class CreateDoDmsDto {
    // @ApiPropertyOptional({ description: 'Organization (m_io) ID' })
    // @IsOptional()
    // @IsUUID()
    // organization_id?: string;
    @ApiProperty({ example: 'SUB' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    organization_code: string;

    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    spb_type: number;

    @ApiProperty({ example: 'FPPR Awal' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    mo_type: string;

    @ApiProperty({ example: '2026-06-08' })
    @IsNotEmpty()
    @IsDateString()
    preparation_date: string;

    @ApiProperty({ example: 'CP-2026-0001' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    callplan_number: string;

    @ApiProperty({ example: '2026-06-08' })
    @IsNotEmpty()
    @IsDateString()
    callplan_date_start: string;

    @ApiProperty({ example: '2026-06-10' })
    @IsNotEmpty()
    @IsDateString()
    callplan_date_end: string;

    @ApiProperty({ example: 'RT-001' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    route_number: string;

    @ApiProperty({ example: 'REGULAR' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    trip_type: string;

    @ApiProperty({ example: '12345678' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    sales_nik: string;

    @ApiProperty({ example: 'John Doe' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    sales_name: string;

    @ApiProperty({ example: 'Supervisor Name' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    sales_spv: string;

    @ApiProperty({ example: '12345678' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    sales_spv_nik: string;

    @ApiProperty({ enum: DoSuggestionStatus, default: DoSuggestionStatus.SUBMITTED })
    @IsNotEmpty()
    @IsEnum(DoSuggestionStatus)
    status: DoSuggestionStatus;

    @ApiProperty({ example: '020000149' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    created_by: string;

    @ApiProperty({ example: '020000149' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    updated_by: string;

    @ApiProperty({ example: '2026-06-08' })
    @IsNotEmpty()
    @IsDateString()
    spb_date: string;

    @ApiProperty({
        example: 'SPB/CP-2026-0001/5001',
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    spb_number: string;

    @ApiProperty({ type: [DoDmsDetailDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => DoDmsDetailDto)
    lines: DoDmsDetailDto[];
}


