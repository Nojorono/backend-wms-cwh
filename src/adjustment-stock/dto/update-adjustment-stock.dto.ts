import { PartialType } from '@nestjs/swagger';
import { CreateAdjustmentStockDto } from './create-adjustment-stock.dto';

export class UpdateAdjustmentStockDto extends PartialType(CreateAdjustmentStockDto) {}
