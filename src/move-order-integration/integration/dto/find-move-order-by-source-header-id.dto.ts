import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class FindMoveOrderBySourceHeaderIdDto {
  @ApiProperty({
    description: 'WMS source header id used when creating the Oracle interface row',
    example: 'b56da9b0-7822-4cab-bf88-a6bdca3af1fc',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  source_header_id: string;

  @ApiPropertyOptional({
    description: 'Source system filter',
    example: 'WMS',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  source_system?: string;
}
