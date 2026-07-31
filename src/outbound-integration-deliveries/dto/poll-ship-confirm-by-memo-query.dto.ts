import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ShipConfirmInternalTransactionType } from '../../core/domain/entities/outbound-integration-deliveries.entity';

/** Query for poll-status by outbound DO — filters shipconfirm.find by transaction_type. */
export class PollShipConfirmByMemoQueryDto {
  @ApiProperty({
    enum: ShipConfirmInternalTransactionType,
    example: ShipConfirmInternalTransactionType.OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM,
    description:
      'Oracle transaction type. Find keys differ by type: ' +
      'PICK_RELEASE → source_header_id + source_line_id (+ iso_header_id); ' +
      'SHIP_CONFIRM → source_header_id + delivery_id; ' +
      'MUTASI → source_header_id + iso_header_id.',
  })
  @IsEnum(ShipConfirmInternalTransactionType)
  transaction_type: ShipConfirmInternalTransactionType;
}
