import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MoveOrderStatus, MoveOrderType } from '../../core/domain/entities/move-order.entity';

export class CreateMoveOrderItemDto {
  @ApiProperty({
    description: 'Identifier of the item that will be moved',
    example: '7d2d9306-98bb-4d0f-9b17-5c37124895f3',
  })
  @IsUUID(4, { message: 'item_id must be a valid UUID' })
  item_id: string;

  @ApiPropertyOptional({
    description: 'Production date of the lot to be moved',
    example: '2024-10-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'production_date must be a valid ISO date string' })
  production_date?: string;

  @ApiPropertyOptional({
    description: 'Production week number associated with the lot',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'week_number must be an integer number' })
  @IsPositive({ message: 'week_number must be greater than 0' })
  week_number?: number;

  @ApiPropertyOptional({
    description: 'Pallet identifier if the item is attached to a specific pallet',
    example: '2a3bfc74-7a33-4ea4-985d-5becfe59037f',
  })
  @IsOptional()
  @IsUUID(4, { message: 'pallet_id must be a valid UUID' })
  pallet_id?: string;

  @ApiProperty({
    description: 'Quantity that will be moved',
    example: 120,
  })
  @Type(() => Number)
  @IsPositive({ message: 'quantity must be greater than 0' })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Unit of measure used for the quantity',
    example: 'CARTON',
  })
  @IsOptional()
  @IsString({ message: 'uom must be a string' })
  @IsNotEmpty({ message: 'uom cannot be empty when provided' })
  uom?: string;
}

export class CreateMoveOrderDto {
  @ApiPropertyOptional({
    description: 'Override for the auto-generated move order number',
    example: 'MO-20250101-0001',
  })
  @IsOptional()
  @IsString({ message: 'move_order_number must be a string' })
  move_order_number?: string;

  @ApiProperty({
    description: 'Type of move order',
    enum: MoveOrderType,
    example: MoveOrderType.TRANSFER_SELISIH,
  })
  @IsEnum(MoveOrderType, { message: 'move_order_type must be a valid MoveOrderType' })
  move_order_type: MoveOrderType;

  @ApiPropertyOptional({
    description: 'Initial status of the move order (defaults to CREATED)',
    enum: MoveOrderStatus,
    example: MoveOrderStatus.CREATED,
  })
  @IsOptional()
  @IsEnum(MoveOrderStatus, { message: 'move_order_status must be a valid MoveOrderStatus' })
  move_order_status?: MoveOrderStatus;

  @ApiProperty({
    description: 'List of items attached to the move order',
    type: () => [CreateMoveOrderItemDto],
  })
  @IsArray({ message: 'move_order_items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreateMoveOrderItemDto)
  move_order_items: CreateMoveOrderItemDto[];
}

