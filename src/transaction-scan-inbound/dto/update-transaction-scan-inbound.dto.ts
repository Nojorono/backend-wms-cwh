import { PartialType } from '@nestjs/swagger';
import { CreateTransactionScanInboundDto } from './create-transaction-scan-inbound.dto';

export class UpdateTransactionScanInboundDto extends PartialType(CreateTransactionScanInboundDto) {}


