import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInboundIntegrationDto } from './create-inbound-integration.dto';
import { CreateInboundIntegrationLineDto } from './create-inbound-integration-line.dto';

export class CreateInboundIntegrationPayloadDto extends CreateInboundIntegrationDto {
  @ApiProperty({ type: [CreateInboundIntegrationLineDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInboundIntegrationLineDto)
  lines?: CreateInboundIntegrationLineDto[];
}
