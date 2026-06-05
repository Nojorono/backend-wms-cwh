import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';
import {
  InvOnHandMappingDetailQueryDto,
  InvOnHandMappingDetailResponseDto,
} from '../dto/inv-on-hand-mapping.dto';

@Injectable()
export class InvOnHandMappingIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(InvOnHandMappingIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(
    @Inject('INV_ON_HAND_QTY_SERVICE')
    private readonly invOnHandQtyClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing INV_ON_HAND_QTY_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('INV_ON_HAND_QTY_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.invOnHandQtyClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'inv_on_hand_qty_queue',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  /**
   * RMQ `get_on_hand_mapping_detail` with optional organization/subinventory filters.
   */
  async getOnHandMappingDetail(
    params?: InvOnHandMappingDetailQueryDto,
  ): Promise<InvOnHandMappingDetailResponseDto> {
    try {
      const timeoutMs = 30000;
      const response = await firstValueFrom(
        this.invOnHandQtyClient
          .send<InvOnHandMappingDetailResponseDto>('get_on_hand_mapping_detail', params ?? {})
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `INV_ON_HAND_QTY_SERVICE request failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling get_on_hand_mapping_detail: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        status: false,
        message: `Error in microservice: ${error instanceof Error ? error.message : String(error)}`,
        data: [],
        count: 0,
        statusCode: 500,
      };
    }
  }
}
