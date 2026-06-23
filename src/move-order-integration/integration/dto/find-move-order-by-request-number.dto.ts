import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class FindMoveOrderByRequestNumberDto {
  @ApiProperty({
    description: 'Move order request number',
    example: 'JAT/SPB/2024/01/000002',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  request_number: string;

  @ApiPropertyOptional({
    description: 'Source system filter',
    example: 'DMS',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  source_system?: string;
}
