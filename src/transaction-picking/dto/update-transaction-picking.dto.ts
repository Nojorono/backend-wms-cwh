import { PartialType } from '@nestjs/swagger';
import { CreateTransactionPickingDto } from './create-transaction-picking.dto';

export class UpdateTransactionPickingDto extends PartialType(CreateTransactionPickingDto) {}
