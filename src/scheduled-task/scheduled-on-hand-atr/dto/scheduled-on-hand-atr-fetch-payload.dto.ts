import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { onHandAtrDateNowExample } from '../../../outbound-sales/dto/inv-on-hand-qty-with-atr.dto';

export class ScheduledOnHandAtrFetchPayloadDto {
  @ApiPropertyOptional({
    example: onHandAtrDateNowExample(),
    description: 'Snapshot date (YYYY-MM-DD). Default: today',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: 'KECIL',
    description: 'Subinventory code(s). Default: ON_HAND_ATR_DEFAULT_SUBINVENTORY env',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(String);
    }
    return String(value);
  })
  subinventory_code?: string | string[];

  @ApiPropertyOptional({ example: 'SYSTEM' })
  @IsOptional()
  @IsString()
  created_by?: string;

  @ApiPropertyOptional({
    example: 'BRANCH,SUBBRANCH',
    description: 'Comma-separated organization_type filter for cabang lookup',
  })
  @IsOptional()
  @IsString()
  organization_types?: string;
}
