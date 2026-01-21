import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SupplierQueryDto {
    @ApiPropertyOptional({ description: 'Search term' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Items per page', example: 10, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({
        description: 'Attribute 7 to filter by. Use GET /supplier/attribute7/list to get all available values',
        example: 'FREIGHT (FRG)',
        required: false,
        enum: [
            'BRAND (BRD)',
            'DIGITAL (DIG)',
            'EXTERNAL (EXT)',
            'FREIGHT (FRG)',
            'GENERAL AFFAIR (GA)',
            'GOVERNMENT (GOV)',
            'HORECA (HRC)',
            'HUMAN RESOURCES (HR)',
            'INTERNAL (INT)',
            'IT (IT)',
            'MARKETING SUPPORT (MKT-SUPP)',
            'PRINCIPLE (PRIN)',
            'PRODUCTION (PROD)',
            'OTHER',
            // Add more common values here if needed
            // Full list available via GET /supplier/attribute7/list endpoint
        ],
    })
    @IsOptional()
    @IsString()
    attribute7?: string;
}
