import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Status } from '../../core/domain/entities/transaction-picking.entity';

const sanitizeOptionalUuid = (value: any): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && (value.trim() === '' || value.trim().toUpperCase() === 'N/A')) {
    return undefined;
  }
  return value;
};

export class CreateTransactionPickingDto {
  @ApiProperty({ description: 'ID outbound do' })
  @IsNotEmpty()
  @IsUUID('4')
  do_id: string;

  @ApiProperty({ description: 'ID outbound memo' })
  @IsNotEmpty()
  @IsUUID('4')
  memo_id: string;

  @ApiProperty({ description: 'ID item' })
  @IsNotEmpty()
  @IsUUID('4')
  item_id: string;

  @ApiProperty({ description: 'ID warehouse sub sumber', required: false })
  @IsOptional()
  @Transform(({ value }) => sanitizeOptionalUuid(value))
  @IsUUID('4')
  source_warehouse_sub_id?: string;

  @ApiProperty({ description: 'ID bin sumber', required: false })
  @IsOptional()
  @Transform(({ value }) => sanitizeOptionalUuid(value))
  @IsUUID('4')
  source_bin_id?: string;

  @ApiProperty({ description: 'ID warehouse sub tujuan', required: false })
  @IsOptional()
  @Transform(({ value }) => sanitizeOptionalUuid(value))
  @IsUUID('4')
  destination_warehouse_sub_id?: string;

  @ApiProperty({ description: 'ID bin tujuan', required: false })
  @IsOptional()
  @Transform(({ value }) => sanitizeOptionalUuid(value))
  @IsUUID('4')
  destination_bin_id?: string;

  @ApiProperty({ description: 'Quantity yang di-pick' })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'UOM', required: false })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  week_number: number;

  @ApiProperty({
    description: 'Status picking',
    enum: Status,
    default: Status.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}

export class CreateManyTransactionPickingDto {
  @ApiProperty({
    description: 'Array of transaction picking to create',
    type: [CreateTransactionPickingDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionPickingDto)
  @IsNotEmpty()
  data: CreateTransactionPickingDto[];
}
