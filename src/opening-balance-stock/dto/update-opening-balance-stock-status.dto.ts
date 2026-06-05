import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OpeningBalanceStockStatus } from '../../core/domain/entities/opening-balance-stock.entity';

export class UpdateOpeningBalanceStockStatusDto {
  @ApiProperty({
    enum: OpeningBalanceStockStatus,
    example: OpeningBalanceStockStatus.CONFIRMED,
    description: 'Opening balance stock status',
  })
  @IsEnum(OpeningBalanceStockStatus)
  status: OpeningBalanceStockStatus;
}
