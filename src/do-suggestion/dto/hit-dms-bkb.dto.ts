import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class HitDmsBkbDto {
  @ApiProperty({ example: 'JAS/SPB/2026/08/0005' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  spb_number: string;
}
