import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { onHandAtrDateNowExample } from './inv-on-hand-qty-with-atr.dto';

export class TotalSubmittedQueryDto {
  @ApiProperty({
    description: 'Callplan date start filter (YYYY-MM-DD)',
    example: onHandAtrDateNowExample(),
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
