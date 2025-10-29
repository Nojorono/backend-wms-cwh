import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Status } from 'src/core/domain/entities/transaction-put-away.entity';

export class CreatePutAwayDto {
  @ApiProperty({ example: 'inventory-tracking-uuid', required: false })
  @IsUUID()
  @IsOptional()
  inventory_tracking_id?: string;

  @ApiProperty({ example: 'warehouse-bin-uuid', required: false })
  @IsUUID()
  @IsOptional()
  destination_bin_id?: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  @IsUUID()
  @IsOptional()
  forklift_driver_id?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  driver_name?: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  @IsOptional()
  driver_phone?: string;

  @ApiProperty({ example: Status.PENDING })
  @IsString()
  @IsOptional()
  status?: Status;

  @ApiProperty({ example: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePutAwayDto extends PartialType(CreatePutAwayDto) {}
