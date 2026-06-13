import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ShipConfirmInternalTransactionType } from '../../core/domain/entities/outbound-integration-deliveries.entity';

/** Query for poll-status by outbound DO — filters shipconfirm.find by transaction_type. */
export class PollShipConfirmByMemoQueryDto {
  @ApiProperty({
    enum: ShipConfirmInternalTransactionType,
    example: ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM,
    description:
      'Oracle transaction type; shipconfirm.find uses source_header_id (memo id) + this value',
  })
  @IsEnum(ShipConfirmInternalTransactionType)
  transaction_type: ShipConfirmInternalTransactionType;
}
