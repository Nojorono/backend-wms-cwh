import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionScanPickingDto {
  @ApiProperty({
    description: 'ID transaksi picking terkait',
    example: '4d4ebd7a-8c69-4f4e-bb53-91b3f0170123',
  })
  @IsString()
  transaction_picking_id: string;

  @ApiPropertyOptional({
    description: 'ID pallet sumber',
    example: 'f508b5d0-7722-4e45-902d-04cc23f410a6',
  })
  @IsOptional()
  @IsString()
  pallet_source_id?: string;

  @ApiPropertyOptional({
    description: 'ID pallet yang digunakan',
    example: '2a9cd3dd-61e3-4f23-8b7a-902c9fc184e5',
  })
  @IsOptional()
  @IsString()
  pallet_use_id?: string;

  @ApiPropertyOptional({
    description: 'ID pallet pengganti',
    example: 'b3f2a33d-1b01-4fb4-a446-6063216ff701',
  })
  @IsOptional()
  @IsString()
  pallet_switch_id?: string;

  @ApiProperty({
    description: 'Jumlah yang dipicking dari pallet sumber',
    example: 120,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity_picked: number;

  @ApiPropertyOptional({
    description: 'Jumlah yang dipindahkan ke pallet pengganti',
    example: 20,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  quantity_switch?: number;

  @ApiPropertyOptional({
    description: 'Satuan unit yang digunakan',
    example: 'PCS',
  })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional({
    description: 'Week number',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  week_number?: number;

  @ApiPropertyOptional({
    description: 'Status transaksi scan picking',
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'User yang melakukan inspeksi',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  inspection_by?: string;
}

