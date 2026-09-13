import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateOutboundIntegrationIrReqDto } from './update-outbound-integration-ir-req.dto';
import { CreateOutboundIntegrationIrReqLineDto } from './create-outbound-integration-ir-req-line.dto';

export class UpdateOutboundIntegrationIrReqPayloadDto extends UpdateOutboundIntegrationIrReqDto {
  @ApiProperty({ type: [CreateOutboundIntegrationIrReqLineDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOutboundIntegrationIrReqLineDto)
  lines?: CreateOutboundIntegrationIrReqLineDto[];
}
