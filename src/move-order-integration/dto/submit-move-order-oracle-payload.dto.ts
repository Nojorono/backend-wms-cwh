import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CreateMoveOrderWithLinesDto } from '../integration/dto/create-move-order-with-lines.dto';
import { CreateMoveOrderIntegrationPayloadDto } from './create-move-order-integration-payload.dto';

export class SubmitMoveOrderOraclePayloadDto extends CreateMoveOrderWithLinesDto {
  @ApiPropertyOptional({ description: 'User ID for Oracle audit', example: 1234 })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ description: 'User name for Oracle audit', example: 'John Doe' })
  @IsOptional()
  @IsString()
  userName?: string;
}

export class CreateAndIntegrateMoveOrderPayloadDto extends CreateMoveOrderIntegrationPayloadDto {
  @ApiPropertyOptional({ description: 'User ID for Oracle audit', example: 1234 })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ description: 'User name for Oracle audit', example: 'John Doe' })
  @IsOptional()
  @IsString()
  userName?: string;
}
