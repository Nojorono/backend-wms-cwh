import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MoveOrderIntegrationContextDto {
  @ApiPropertyOptional({ description: 'User ID for Oracle audit', example: 1234 })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ description: 'User name for Oracle audit', example: 'John Doe' })
  @IsOptional()
  @IsString()
  userName?: string;
}
