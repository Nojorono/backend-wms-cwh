import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class WmsAssistantChatMessageDto {
  @ApiProperty({ enum: ['system', 'user', 'assistant'] })
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'How does DO suggestion integrate to move order?' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class WmsAssistantChatRequestDto {
  @ApiProperty({
    example: 'Explain the move order integration polling flow',
    description: 'User message to send to the assistant',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    type: [WmsAssistantChatMessageDto],
    description: 'Optional prior conversation turns (user/assistant only)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WmsAssistantChatMessageDto)
  history?: WmsAssistantChatMessageDto[];

  @ApiPropertyOptional({ example: 'qwen3:8b', description: 'Override default Ollama model' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Enable qwen3 thinking mode (slower, verbose). Default false.',
  })
  @IsOptional()
  @IsBoolean()
  think?: boolean;
}
