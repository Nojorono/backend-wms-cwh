import { Injectable, Logger } from '@nestjs/common';
import { WMS_ASSISTANT_SYSTEM_PROMPT } from './constants/wms-assistant-system-prompt';
import { WmsAssistantChatRequestDto } from './dto/wms-assistant-chat-request.dto';
import {
  WmsAssistantChatResponseDto,
  WmsAssistantHealthResponseDto,
  WmsAssistantModelsResponseDto,
} from './dto/wms-assistant-response.dto';
import { OllamaService } from './integration/ollama.service';
import { OllamaChatMessage } from './types/ollama.types';

@Injectable()
export class WmsAssistantService {
  private readonly logger = new Logger(WmsAssistantService.name);

  constructor(private readonly ollamaService: OllamaService) {}

  async chat(dto: WmsAssistantChatRequestDto): Promise<WmsAssistantChatResponseDto> {
    const messages = this.buildMessages(dto);
    const response = await this.ollamaService.chat(messages, {
      model: dto.model,
      think: dto.think,
    });

    const reply = response.message?.content?.trim();
    if (!reply) {
      this.logger.warn(`Ollama returned empty content for model=${response.model}`);
    }

    return {
      model: response.model,
      reply: reply || 'No response generated.',
      thinking: response.message?.thinking?.trim() || undefined,
      promptEvalCount: response.prompt_eval_count,
      evalCount: response.eval_count,
      totalDurationNs: response.total_duration,
    };
  }

  async listModels(): Promise<WmsAssistantModelsResponseDto> {
    const response = await this.ollamaService.listModels();

    return {
      defaultModel: this.ollamaService.getDefaultModel(),
      baseUrl: this.ollamaService.getBaseUrl(),
      models: response.models.map((model) => ({
        name: model.name,
        model: model.model,
        size: model.size,
        modifiedAt: model.modified_at,
      })),
    };
  }

  async health(): Promise<WmsAssistantHealthResponseDto> {
    const ping = await this.ollamaService.ping();

    return {
      ok: ping.ok,
      model: ping.model,
      modelCount: ping.modelCount,
      baseUrl: this.ollamaService.getBaseUrl(),
    };
  }

  private buildMessages(dto: WmsAssistantChatRequestDto): OllamaChatMessage[] {
    const messages: OllamaChatMessage[] = [
      { role: 'system', content: WMS_ASSISTANT_SYSTEM_PROMPT },
    ];

    if (dto.history?.length) {
      for (const turn of dto.history) {
        if (turn.role === 'system') {
          continue;
        }
        messages.push({ role: turn.role, content: turn.content.trim() });
      }
    }

    messages.push({ role: 'user', content: dto.message.trim() });
    return messages;
  }
}
