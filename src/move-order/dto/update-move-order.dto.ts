import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMoveOrderDto } from './create-move-order.dto';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { MoveOrderStatus } from '../../core/domain/entities/move-order.entity';

export class UpdateMoveOrderDto extends PartialType(CreateMoveOrderDto) {}

export class UpdateMoveOrderStatusDto {
  @ApiProperty({
    description: 'New status for the move order',
    enum: MoveOrderStatus,
    example: MoveOrderStatus.APPROVED,
  })
  @IsNotEmpty({ message: 'status is required' })
  @IsEnum(MoveOrderStatus, { message: 'status must be a valid MoveOrderStatus' })
  status: MoveOrderStatus;
}

