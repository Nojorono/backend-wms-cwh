import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FindDoSuggestionByCallplanDto {
  @ApiProperty({ example: 'KRW/2026/7/000054.1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  callplanNumber: string;
}
