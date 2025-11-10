import { PartialType } from '@nestjs/swagger';
import { CreateTransactionScanPickingDto } from './create-transaction-scan-picking.dto';

export class UpdateTransactionScanPickingDto extends PartialType(
  CreateTransactionScanPickingDto,
) {}

