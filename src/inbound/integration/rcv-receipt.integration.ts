import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';
import {
  CreateRcvReceiptDto,
  CreateRcvReceiptLinesDto,
} from './dto/create-rcv-receipt.dto';

export { CreateRcvReceiptDto, CreateRcvReceiptLinesDto };

export type RcvReceiptResponseDto = Record<string, unknown>;

/** Matches RCV microservice `@Payload() CreateRcvReceiptDto | CreateRcvReceiptDto[]`. */
export type CreateRcvReceiptPayload = CreateRcvReceiptDto | CreateRcvReceiptDto[];

@Injectable()
export class RcvReceiptIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(RcvReceiptIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(
    @Inject('RCV_RECEIPT_SERVICE')
    private readonly rcvReceiptClient: ClientProxy,
  ) { }

  async onModuleInit() {
    this.logger.log('Initializing RCV_RECEIPT_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('RCV_RECEIPT_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.rcvReceiptClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'rcv_receipt',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  async createRcvReceipt(payload: CreateRcvReceiptPayload): Promise<RcvReceiptResponseDto> {
    try {
      const timeoutMs = 30000;
      return await firstValueFrom(
        this.rcvReceiptClient
          .send<RcvReceiptResponseDto>('rcv-receipt.create', payload)
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(`RCV_RECEIPT_SERVICE request failed: ${error.message || 'Unknown error'}`);
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling rcv-receipt.create: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }

  /** RMQ `rcv-receipt.findBySourceHeaderId` → payload `{ source_header_id }` (handler lives on the RCV service). */
  async findBySourceHeaderId(source_header_id: string): Promise<RcvReceiptResponseDto> {
    try {
      const timeoutMs = 30000;
      return await firstValueFrom(
        this.rcvReceiptClient
          .send<RcvReceiptResponseDto>('rcv-receipt.findBySourceHeaderId', {
            source_header_id,
          })
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(`RCV_RECEIPT_SERVICE request failed: ${error.message || 'Unknown error'}`);
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling rcv-receipt.findBySourceHeaderId: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }
}
