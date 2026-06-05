import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';

export type OntBranchesFindAllResponseDto = unknown;

@Injectable()
export class IOIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(IOIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(
    @Inject('ONT_BRANCHES_SERVICE')
    private readonly ontBranchesClient: ClientProxy,
  ) { }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing ONT_BRANCHES_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('ONT_BRANCHES_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.ontBranchesClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'ont_branches',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  /** Calls `OntBranchesMicroserviceController` @MessagePattern('ont-branches.findAll') */
  async findAll(): Promise<OntBranchesFindAllResponseDto> {
    try {
      const timeoutMs = 30000;
      return await firstValueFrom(
        this.ontBranchesClient
          .send<OntBranchesFindAllResponseDto>('ont-branches.findAll', {})
          .pipe(
            timeout(timeoutMs),
            catchError((error: unknown) => {
              const msg = formatMicroserviceError(error);
              this.logger.error(`ONT_BRANCHES_SERVICE request failed: ${msg}`);
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error: unknown) {
      this.connectionEstablished = false;
      const msg = formatMicroserviceError(error);
      this.logger.error(
        `Error calling ont-branches.findAll: ${msg}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { success: false, error: msg };
    }
  }
}

function formatMicroserviceError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
