import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WmsAssistantChatResponseDto {
  @ApiProperty({ example: 'qwen3:8b' })
  model: string;

  @ApiProperty({
    example: 'Move order integration polling checks Oracle status via RMQ findBySourceHeaderId...',
  })
  reply: string;

  @ApiPropertyOptional({
    example: 'Let me think about the polling flow...',
    description: 'Present when think=true and model returns reasoning',
  })
  thinking?: string;

  @ApiPropertyOptional({ example: 842 })
  promptEvalCount?: number;

  @ApiPropertyOptional({ example: 156 })
  evalCount?: number;

  @ApiPropertyOptional({ example: 1250000000 })
  totalDurationNs?: number;
}

export class WmsAssistantModelsResponseDto {
  @ApiProperty({ example: 'qwen3:8b' })
  defaultModel: string;

  @ApiProperty({ example: 'http://localhost:11434' })
  baseUrl: string;

  @ApiProperty({
    example: [{ name: 'qwen3:8b', model: 'qwen3:8b', size: 5200000000 }],
  })
  models: Array<{
    name: string;
    model: string;
    size: number;
    modifiedAt: string;
  }>;
}

export class WmsAssistantHealthResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 'qwen3:8b' })
  model: string;

  @ApiProperty({ example: 1 })
  modelCount: number;

  @ApiProperty({ example: 'http://localhost:11434' })
  baseUrl: string;
}
