import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateInboundDto, CreateInboundDoDto, CreateInboundItemDto } from './create-inbound.dto';

export class UpdateInboundItemDto extends PartialType(CreateInboundItemDto) { }
export class UpdateInboundDoDto extends PartialType(CreateInboundDoDto) { }
export class UpdateInboundDto extends PartialType(CreateInboundDto) {
  @ApiPropertyOptional({ description: 'Photo Condition' })
  @IsOptional()
  @IsString()
  photo_condition?: string;

  @ApiPropertyOptional({ description: 'Photo License Plate' })
  @IsOptional()
  @IsString()
  photo_license_plate?: string;

  @ApiPropertyOptional({ description: 'Photo Seal' })
  @IsOptional()
  @IsString()
  photo_seal?: string;
}

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
