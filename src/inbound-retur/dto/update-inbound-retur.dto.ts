import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateInboundReturDto } from './create-inbound-retur.dto';
import { InboundReturStatus } from '../../core/domain/entities/inbound-retur.entity';

export class UpdateInboundReturDto extends PartialType(CreateInboundReturDto) { }

export class UpdateInboundReturStatusDto {
  @ApiProperty({
    enum: InboundReturStatus,
    enumName: 'InboundReturStatus',
    example: InboundReturStatus.ASSIGNED_HELPER,
    description: 'New status for the inbound retur',
  })
  @IsEnum(InboundReturStatus)
  status: InboundReturStatus;
}
