import { PartialType } from '@nestjs/swagger';
import { CreateOpeningBalanceStockDto } from './create-opening-balance-stock.dto';

export class UpdateOpeningBalanceStockDto extends PartialType(CreateOpeningBalanceStockDto) {}
