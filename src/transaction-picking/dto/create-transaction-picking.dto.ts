import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Status } from '../../core/domain/entities/transaction-picking.entity';

export class CreateTransactionPickingDto {
  @ApiProperty({ description: 'ID outbound do' })
  @IsNotEmpty()
  @IsString()
  do_id: string;

  @ApiProperty({ description: 'ID outbound memo' })
  @IsNotEmpty()
  @IsString()
  memo_id: string;

  @ApiProperty({ description: 'ID item' })
  @IsNotEmpty()
  @IsString()
  item_id: string;

  @ApiProperty({ description: 'ID warehouse sub sumber', required: false })
  @IsOptional()
  @IsString()
  source_warehouse_sub_id?: string;

  @ApiProperty({ description: 'ID bin sumber', required: false })
  @IsOptional()
  @IsString()
  source_bin_id?: string;

  @ApiProperty({ description: 'ID warehouse sub tujuan', required: false })
  @IsOptional()
  @IsString()
  destination_warehouse_sub_id?: string;

  @ApiProperty({ description: 'ID bin tujuan', required: false })
  @IsOptional()
  @IsString()
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
