import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DmsIntegrationTokenRequestDto {
  @ApiProperty({
    description: 'Integration application identifier',
    example: 'dms-integration',
  })
  @IsString()
  @IsNotEmpty()
  app_id: string;

  @ApiProperty({
    description: 'Integration application secret configured in environment',
    example: 'change-me-in-env',
  })
  @IsString()
  @IsNotEmpty()
  app_secret: string;
}

export class DmsIntegrationTokenResponseDto {
  @ApiProperty({ example: 'dms-integration' })
  app_id: string;

  @ApiProperty({
    description: 'Bearer token for DMS integration endpoints',
  })
  access_token: string;

  @ApiProperty({ example: 'Bearer' })
  token_type: string;

  @ApiProperty({
    description: 'Token lifetime in seconds',
    example: 86400,
  })
  expires_in: number;
}
