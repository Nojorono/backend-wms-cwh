import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from '../../core/helpers/rmq-connection.helper';
import { PoLineQueryDto } from '../dto/po-line-query.dto';

@Injectable()
export class PoLineIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(PoLineIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(@Inject('PO_LINE_SERVICE') private readonly poLineClient: ClientProxy) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing PO_LINE_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('PO_LINE_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.poLineClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'po_line_queue',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  async findAllPoLines(query: PoLineQueryDto): Promise<unknown> {
    try {
      await this.ensureConnection();

      const queryParams: PoLineQueryDto = {
        vendor_id: query.vendor_id,
        segment1: query.segment1,
        item_description: query.item_description,
        po_line_id: query.po_line_id,
        page: query.page,
        limit: query.limit,
      };

      this.logger.log('Sending po-line.findAll with params:', queryParams);

      const timeoutMs = 30000;
      const response = await firstValueFrom(
        this.poLineClient.send<unknown>('po-line.findAll', queryParams).pipe(
          timeout(timeoutMs),
          catchError((error) => {
            this.logger.error(`po-line.findAll failed: ${error.message || 'Unknown error'}`);
            this.connectionEstablished = false;
            throw error;
          }),
        ),
      );

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling po-line.findAll: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
