import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  ValidateBy,
  IsPositive,
  IsNumber,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreatePalletUpdateItemDto {
  @ApiPropertyOptional({ example: 'uuid-pallet-update-123' })
  @IsOptional()
  @IsUUID(4, { message: 'palletUpdateId must be a valid UUID' })
  palletUpdateId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Sequence number for the item' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'sequence must be an integer' })
  @Min(1, { message: 'sequence must be at least 1' })
  sequence?: number;

  @ApiPropertyOptional({ example: 'uuid-pallet-123' })
  @IsOptional()
  @IsUUID(4, { message: 'palletId must be a valid UUID' })
  palletId?: string;

  @ApiPropertyOptional({ example: 'uuid-item-123' })
  @IsOptional()
  @IsUUID(4, { message: 'itemId must be a valid UUID' })
  itemId?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt({ message: 'quantity must be an integer' })
  @Min(0, { message: 'quantity must be at least 0' })
  quantity?: number;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString({ message: 'uom must be a string' })
  uom?: string;

  @ApiPropertyOptional({
    example: '2026-01-23T00:00:00.000Z',
    description: 'ISO date string (e.g. 2025-01-01 or 2026-01-23T00:00:00.000Z)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value == null || value === '' ? undefined : new Date(value),
  )
  @ValidateBy({
    name: 'isValidDate',
    validator: {
      validate(value: unknown): boolean {
        if (value == null) return true;
        return (
          value instanceof Date && !Number.isNaN(value.getTime())
        );
      },
      defaultMessage() {
        return 'productionDate must be a valid ISO date string (e.g. 2025-01-01 or 2026-01-23T00:00:00.000Z)';
      },
    },
  })
  productionDate?: Date;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'weekNumber must be a number' })
  @IsPositive({ message: 'weekNumber must be a positive number' })
  weekNumber?: number;
}
