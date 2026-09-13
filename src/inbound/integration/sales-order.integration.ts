import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';

export interface SalesOrderFindResponseDto {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

@Injectable()
export class SalesOrderIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(SalesOrderIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(
    @Inject('SALES_ORDER_SERVICE')
    private readonly salesOrderClient: ClientProxy,
  ) { }

  async onModuleInit() {
    this.logger.log('Initializing SALES_ORDER_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('SALES_ORDER_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.salesOrderClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'sales_order',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  async findByOrderNumber(order_number: string): Promise<SalesOrderFindResponseDto> {
    try {
      const timeoutMs = 30000;
      return await firstValueFrom(
        this.salesOrderClient
          .send<SalesOrderFindResponseDto>('sales-order.findByOrderNumber', { order_number })
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(`SALES_ORDER_SERVICE request failed: ${error.message || 'Unknown error'}`);
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling sales-order.findByOrderNumber: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      return {
        success: false,
        error: error?.message || 'Unknown error',
      };
    }
  }
}
