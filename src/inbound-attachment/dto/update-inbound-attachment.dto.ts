import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInboundAttachmentDto {
  @ApiProperty({ example: '1', required: true })
  @IsString()
  @IsNotEmpty()
  inbound_plan_id: string;

  @ApiProperty({ example: 1, required: true })
  @IsNumber()
  @IsNotEmpty()
  organization_id: number; 

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '1', required: false })
  @IsString()
  @IsOptional()
  path?: string;
} 