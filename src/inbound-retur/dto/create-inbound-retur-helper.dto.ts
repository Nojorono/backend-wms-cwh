import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInboundReturHelperDto {
  @ApiPropertyOptional({ example: 'uuid-inbound-retur-1' })
  @IsOptional()
  @IsString()
  inbound_retur_id: string;

  @ApiPropertyOptional({ example: 'uuid-helper-user-1' })
  @IsOptional()
  @IsString()
  helper_user_id?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  helper_name?: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  helper_phone?: string;
}
