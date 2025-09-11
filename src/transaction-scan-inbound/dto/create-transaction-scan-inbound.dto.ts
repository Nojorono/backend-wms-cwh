import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ScanInboundStatus } from '../../core/domain/entities/transaction-scan-inbound.entity';

export class CreateTransactionScanInboundDto {
  @ApiProperty({ example: 'uuid-inbound-123' })
  @IsString()
  inbound_id: string;

  @ApiProperty({ example: 'uuid-item-123' })
  @IsString()
  item_id: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional({ example: 'uuid-user-1' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  user_name?: string;

  @ApiPropertyOptional({ example: 'PAL-123' })
  @IsOptional()
  @IsString()
  pallet_code?: string;

  @ApiPropertyOptional({ enum: ScanInboundStatus, example: ScanInboundStatus.PENDING })
  @IsOptional()
  @IsEnum(ScanInboundStatus)
  status?: ScanInboundStatus;
}

export class CreateTransactionScanInboundDtoPallet {
  @ApiProperty({ example: 'uuid-inbound-123' })
  @IsString()
  inbound_id: string;

  @ApiProperty({ example: 'uuid-item-123' })
  @IsString()
  item_id: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'PCS' })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional({ example: 'uuid-user-1' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  user_name?: string;

  @ApiPropertyOptional({ example: 'uuid-pallet-1' })
  @IsOptional()
  @IsString()
  pallet_id?: string;

  @ApiPropertyOptional({ enum: ScanInboundStatus, example: ScanInboundStatus.PENDING })
  @IsOptional()
  @IsEnum(ScanInboundStatus)
  status?: ScanInboundStatus;
}





