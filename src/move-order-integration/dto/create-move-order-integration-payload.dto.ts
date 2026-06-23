import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMoveOrderIntegrationDto } from './create-move-order-integration.dto';
import { CreateMoveOrderIntegrationLineDto } from './create-move-order-integration-line.dto';

export class CreateMoveOrderIntegrationPayloadDto extends CreateMoveOrderIntegrationDto {
  @ApiProperty({ type: [CreateMoveOrderIntegrationLineDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMoveOrderIntegrationLineDto)
  lines?: CreateMoveOrderIntegrationLineDto[];
}
