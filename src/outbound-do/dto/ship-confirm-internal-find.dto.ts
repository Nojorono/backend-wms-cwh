import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class ShipConfirmInternalFindDto {
  @ApiProperty({ example: 'HDR-2026-0001', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_header_id?: string;

  @ApiProperty({ example: 12345, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  iso_header_id?: number;
}
