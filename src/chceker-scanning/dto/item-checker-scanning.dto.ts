import { IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ItemCheckerScanningDto {
 @ApiProperty({ 
    description: 'Actual quantity scanned',
    example: 100.00
  })
  @IsNumber()
  actual_qty: number;

  @ApiProperty({ 
    description: 'Pallet code',
    example: 'PALLET-001',
    required: false
  })
  @IsString()
  @IsOptional()
  pallet_code?: string;
}