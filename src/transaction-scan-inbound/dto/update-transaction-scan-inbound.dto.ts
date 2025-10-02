import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTransactionScanInboundDto } from './create-transaction-scan-inbound.dto';
import { IsArray, IsString } from 'class-validator';

export class UpdateTransactionScanInboundDto extends PartialType(CreateTransactionScanInboundDto) {}

export class UpdateManyStatusToDto {
    @ApiProperty({ example: ['uuid-scan-inbound-1', 'uuid-scan-inbound-2'] })
    @IsArray()
    @IsString({ each: true })
    ids: string[];
  } 


