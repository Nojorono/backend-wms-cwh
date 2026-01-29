import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateInboundReturDto } from './create-inbound-retur.dto';
import { InboundReturStatus } from '../../core/domain/entities/inbound-retur.entity';

export class UpdateInboundReturDto extends PartialType(CreateInboundReturDto) {}

export class UpdateInboundReturStatusDto {
  @ApiPropertyOptional({ enum: InboundReturStatus, example: InboundReturStatus.ASSIGNED_HELPER })
  @IsOptional()
  @IsEnum(InboundReturStatus)
  status?: InboundReturStatus;
}
