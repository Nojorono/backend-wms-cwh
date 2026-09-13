import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PalletUpdateStatus } from '../../core/domain/entities/pallet-update.entity';

export class UpdatePalletUpdateStatusDto {
  @ApiProperty({
    enum: PalletUpdateStatus,
    example: PalletUpdateStatus.PENDING_HELPER_ACTION,
    description: 'New header status for the pallet update',
  })
  @IsEnum(PalletUpdateStatus)
  status: PalletUpdateStatus;
}
