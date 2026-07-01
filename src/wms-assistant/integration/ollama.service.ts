import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OllamaChatMessage,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaModelsResponse,
} from '../types/ollama.types';

@Injectable()
export class OllamaService implements OnModuleInit {
  private readonly logger = new Logger(OllamaService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('OLLAMA_WARMUP_ON_START') !== 'true') {
      return;
    }

    try {
      await this.warmupModel();
      this.logger.log(`Ollama model warmed up: ${this.getDefaultModel()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Ollama warmup skipped: ${message}`);
    }
  }

  getDefaultModel(): string {
    return this.configService.get<string>('OLLAMA_MODEL')?.trim() || 'qwen3:8b';
  }

  getBaseUrl(): string {
    return this.configService.get<string>('OLLAMA_BASE_URL')?.trim() || 'http://localhost:11434';
  }

  async listModels(): Promise<OllamaModelsResponse> {
    return this.request<OllamaModelsResponse>('/api/tags', {
      method: 'GET',
      timeoutMs: this.resolveListTimeoutMs(),
    });
  }

  async chat(
    messages: OllamaChatMessage[],
    options?: { model?: string; think?: boolean },
  ): Promise<OllamaChatResponse> {
    const think = options?.think ?? false;
    const body: OllamaChatRequest = {
      model: options?.model?.trim() || this.getDefaultModel(),
      messages,
      stream: false,
      think,
      keep_alive: this.getKeepAlive(),
      options: {
        num_predict: this.resolveNumPredict(think),
      },
    };

    const timeoutMs = this.resolveChatTimeoutMs(think);
    const startedAt = Date.now();

    this.logger.log(
      `Ollama chat start model=${body.model} messages=${messages.length} think=${think} timeoutMs=${timeoutMs}`,
    );

    try {
      const response = await this.request<OllamaChatResponse>('/api/chat', {
        method: 'POST',
        body: JSON.stringify(body),
        timeoutMs,
      });

      this.logger.log(
        `Ollama chat done model=${response.model} durationMs=${Date.now() - startedAt} ` +
          `evalCount=${response.eval_count ?? 0}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Ollama chat failed after ${Date.now() - startedAt}ms think=${think}: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async ping(): Promise<{ ok: boolean; model: string; modelCount: number }> {
    const models = await this.listModels();
    return {
      ok: true,
      model: this.getDefaultModel(),
      modelCount: models.models.length,
    };
  }

  private async warmupModel(): Promise<void> {
    await this.chat([{ role: 'user', content: 'ping' }], { think: false });
  }

  private resolveChatTimeoutMs(think: boolean): number {
    if (think) {
      return Number(this.configService.get('OLLAMA_THINK_TIMEOUT_MS') ?? 600_000);
    }
    return Number(this.configService.get('OLLAMA_TIMEOUT_MS') ?? 300_000);
  }

  private resolveListTimeoutMs(): number {
    return Number(this.configService.get('OLLAMA_LIST_TIMEOUT_MS') ?? 30_000);
  }

  private resolveNumPredict(think: boolean): number {
    if (think) {
      return Number(this.configService.get('OLLAMA_THINK_NUM_PREDICT') ?? 2048);
    }
    return Number(this.configService.get('OLLAMA_NUM_PREDICT') ?? 1024);
  }

  private getKeepAlive(): string {
    return this.configService.get<string>('OLLAMA_KEEP_ALIVE')?.trim() || '10m';
  }

  private async request<T>(
    path: string,
    init: RequestInit & { timeoutMs?: number },
  ): Promise<T> {
    const baseUrl = this.getBaseUrl().replace(/\/+$/, '');
    const timeoutMs = init.timeoutMs ?? this.resolveChatTimeoutMs(false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(init.headers ?? {}),
        },
      });

      const rawText = await response.text();
      let payload: T & { error?: string };

      try {
        payload = JSON.parse(rawText) as T & { error?: string };
      } catch {
        const snippet = rawText.slice(0, 200);
        throw new BadGatewayException(
          `Ollama returned non-JSON response (status ${response.status}): ${snippet}`,
        );
      }

      if (!response.ok) {
        const message = payload.error || `Ollama request failed with status ${response.status}`;
        this.logger.error(`${path} failed: ${message}`);
        throw new BadGatewayException(message);
      }

      return payload;
    } catch (error) {
      if (error instanceof BadGatewayException || error instanceof GatewayTimeoutException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        const message = `Ollama request timed out after ${timeoutMs}ms`;
        this.logger.error(`Ollama ${path} error: ${message}`);
        throw new GatewayTimeoutException(
          `${message}. Tip: set think=false for faster replies, or increase OLLAMA_TIMEOUT_MS` +
            (path.includes('chat') ? ' / OLLAMA_THINK_TIMEOUT_MS when think=true.' : '.'),
        );
      }

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Ollama ${path} error: ${message}`);
      throw new BadGatewayException(`Ollama unavailable: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
