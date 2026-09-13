import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateMoveOrderIntegrationDto } from './update-move-order-integration.dto';
import { CreateMoveOrderIntegrationLineDto } from './create-move-order-integration-line.dto';

export class UpdateMoveOrderIntegrationPayloadDto extends UpdateMoveOrderIntegrationDto {
  @ApiProperty({ type: [CreateMoveOrderIntegrationLineDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMoveOrderIntegrationLineDto)
  lines?: CreateMoveOrderIntegrationLineDto[];
}
