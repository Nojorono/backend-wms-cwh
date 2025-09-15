import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateInboundDto, CreateInboundDoDto, CreateInboundItemDto } from './create-inbound.dto';

export class UpdateInboundItemDto extends PartialType(CreateInboundItemDto) {}
export class UpdateInboundDoDto extends PartialType(CreateInboundDoDto) {}
export class UpdateInboundDto extends PartialType(CreateInboundDto) {}

export class UpdateInboundStatusDto {
  @ApiPropertyOptional({ description: 'Status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
