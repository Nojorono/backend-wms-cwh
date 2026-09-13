import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';
import { CreatePoInternalReqDto, CreatePoInternalReqLinesDto } from './dto/create-po-internal-req.dto';

export { CreatePoInternalReqDto, CreatePoInternalReqLinesDto };

/** One row returned in `data` after successful `po-internal-req.create` (per header inserted). */
export type PoInternalReqCreateDataRow = {
  SOURCE_HEADER_ID: string;
  TOTAL_LINES: number;
  INSERTED_LINES: number;
};

/**
 * Matches PO internal req microservice `create(payloads: CreatePoInternalReqDto[])` success / handled-empty response.
 * On DB/processing errors the handler returns `status: false` and `data: null` (does not throw over RMQ).
 */
export type PoInternalReqCreateResponseDto = {
  status: boolean;
  message: string;
  data: PoInternalReqCreateDataRow[] | null;
};

/** `findBySourceHeaderId` response shape is owned by the PO internal req service; keep loose until contract is shared. */
export type PoInternalReqFindResponseDto = Record<string, unknown>;

@Injectable()
export class IrRequestIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(IrRequestIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(
    @Inject('PO_INTERNAL_REQ_SERVICE')
    private readonly poInternalReqClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing PO_INTERNAL_REQ_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('PO_INTERNAL_REQ_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.poInternalReqClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'po_internal_req',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  /**
   * Sends `po-internal-req.create` with an array payload (same as microservice `create(payloads: CreatePoInternalReqDto[])`).
   * The downstream controller still accepts `Dto | Dto[]`; we always send `Dto[]` for a single code path.
   */
  async createPoInternalReq(payloads: CreatePoInternalReqDto[]): Promise<PoInternalReqCreateResponseDto> {
    try {
      const timeoutMs = 30000;
      return await firstValueFrom(
        this.poInternalReqClient
          .send<PoInternalReqCreateResponseDto>('po-internal-req.create', payloads ?? [])
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `PO_INTERNAL_REQ_SERVICE request failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling po-internal-req.create: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }

  /** RMQ `po-internal-req.findBySourceHeaderId` → payload `{ source_header_id }`. */
  async findBySourceHeaderId(source_header_id: string): Promise<PoInternalReqFindResponseDto> {
    try {
      const timeoutMs = 30000;
      return await firstValueFrom(
        this.poInternalReqClient
          .send<PoInternalReqFindResponseDto>('po-internal-req.findBySourceHeaderId', {
            source_header_id,
          })
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `PO_INTERNAL_REQ_SERVICE request failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling po-internal-req.findBySourceHeaderId: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw error;
    }
  }
}
