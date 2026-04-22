import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateInboundIntegrationDto } from './update-inbound-integration.dto';
import { UpdateInboundIntegrationLineDto } from './update-inbound-integration-line.dto';

export class UpdateInboundIntegrationPayloadDto extends UpdateInboundIntegrationDto {
  @ApiProperty({ type: [UpdateInboundIntegrationLineDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInboundIntegrationLineDto)
  lines?: UpdateInboundIntegrationLineDto[];
}
