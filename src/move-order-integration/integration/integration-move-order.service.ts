import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from '../../core/helpers/rmq-connection.helper';
import { CreateMoveOrderWithLinesDto } from './dto/create-move-order-with-lines.dto';
import { FindMoveOrderBySourceHeaderIdDto } from './dto/find-move-order-by-source-header-id.dto';
import { normalizeMoveOrderFindData } from './move-order-oracle-sync.mapper';
import { MoveOrderFindWithLinesResponseDto } from './dto/move-order-find-with-lines-response.dto';
import {
  MoveOrderWithLinesResponseDto,
} from './dto/move-order-with-lines-response.dto';

import { MoveOrderIntegrationLogService } from './move-order-integration-log.service';

export { CreateMoveOrderWithLinesDto } from './dto/create-move-order-with-lines.dto';
export { CreateMoveOrderOracleDto } from './dto/create-move-order-oracle.dto';
export { CreateMoveOrderLineForHeaderDto } from './dto/create-move-order-line-for-header.dto';
export { FindMoveOrderBySourceHeaderIdDto } from './dto/find-move-order-by-source-header-id.dto';
export { MoveOrderFindWithLinesResponseDto } from './dto/move-order-find-with-lines-response.dto';
export {
  MoveOrderWithLinesResponseDto,
  MoveOrderCreateDataRowDto,
} from './dto/move-order-with-lines-response.dto';

@Injectable()
export class IntegrationMoveOrderService implements OnModuleInit {
  private readonly logger = new Logger(IntegrationMoveOrderService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;
  private readonly REQUEST_TIMEOUT_MS = 30000;

  constructor(
    @Inject('MOVE_ORDER_WMS_SERVICE')
    private readonly moveOrderClient: ClientProxy,
    private readonly integrationLog: MoveOrderIntegrationLogService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.integrationLog.info('rmq', 'Initializing MOVE_ORDER_WMS_SERVICE');
    await this.ensureConnection();
    this.integrationLog.info('rmq', 'MOVE_ORDER_WMS_SERVICE ready');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.moveOrderClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'move_order_wms_queue',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  /** RMQ `move-order-wms.create` — create move order header and lines. */
  async createMoveOrderWithLines(
    createDto: CreateMoveOrderWithLinesDto | CreateMoveOrderWithLinesDto[],
    userId?: number,
    userName?: string,
  ): Promise<MoveOrderWithLinesResponseDto> {
    try {
      await this.ensureConnection();

      const dtoList = Array.isArray(createDto) ? createDto : [createDto];
      const payload = dtoList.map((dto) => this.mapToMoveOrderWmsPayload(dto));

      this.integrationLog.info('rmq-create', 'Sending move-order-wms.create', {
        batch_count: dtoList.length,
        request_numbers: dtoList.map((dto) => dto.REQUEST_NUMBER).join(','),
        user_id: userId,
        user_name: userName,
      });

      const response = await firstValueFrom(
        this.moveOrderClient
          .send<MoveOrderWithLinesResponseDto>('move-order-wms.create', payload)
          .pipe(
            timeout(this.REQUEST_TIMEOUT_MS),
            catchError((error) => {
              this.integrationLog.error('rmq-create', 'RMQ call failed', {
                error: error.message || 'Unknown error',
              });
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.integrationLog.info('rmq-create', 'Received move-order-wms.create response', {
        status: response.status,
        message: response.message,
      });

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.integrationLog.error('rmq-create', 'move-order-wms.create exception', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        status: false,
        message: `Error in microservice: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
        statusCode: 500,
      };
    }
  }

  /** RMQ `move-order-wms.findBySourceHeaderId` — fetch header and lines by source_header_id. */
  async findMoveOrderWithLinesBySourceHeaderId(
    payload: FindMoveOrderBySourceHeaderIdDto,
  ): Promise<MoveOrderFindWithLinesResponseDto> {
    try {
      await this.ensureConnection();

      const sourceHeaderId = payload.source_header_id?.trim();
      this.integrationLog.info('rmq-find', 'Sending move-order-wms.findBySourceHeaderId', {
        source_header_id: sourceHeaderId,
      });

      const response = await firstValueFrom(
        this.moveOrderClient
          .send<MoveOrderFindWithLinesResponseDto>(
            'move-order-wms.findBySourceHeaderId',
            { source_header_id: sourceHeaderId },
          )
          .pipe(
            timeout(this.REQUEST_TIMEOUT_MS),
            catchError((error) => {
              this.integrationLog.error('rmq-find', 'RMQ call failed', {
                source_header_id: sourceHeaderId,
                error: error.message || 'Unknown error',
              });
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.integrationLog.info('rmq-find', 'Received move-order-wms.findBySourceHeaderId response', {
        source_header_id: sourceHeaderId,
        status: response.status,
        message: response.message,
      });

      return this.normalizeFindResponse(response);
    } catch (error) {
      this.connectionEstablished = false;
      this.integrationLog.error('rmq-find', 'move-order-wms.findBySourceHeaderId exception', {
        source_header_id: payload.source_header_id,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        status: false,
        message: `Error in microservice: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
        statusCode: 500,
      };
    }
  }

  private normalizeFindResponse(
    response: MoveOrderFindWithLinesResponseDto,
  ): MoveOrderFindWithLinesResponseDto {
    const normalized = normalizeMoveOrderFindData(
      response.data as Record<string, unknown> | null | undefined,
    );

    if (!normalized) {
      return response;
    }

    return {
      ...response,
      data: normalized,
    };
  }

  private mapToMoveOrderWmsPayload(
    createDto: CreateMoveOrderWithLinesDto,
  ): Record<string, unknown> {
    const { lines, ...header } = createDto as unknown as {
      lines?: Record<string, unknown>[];
      [key: string]: unknown;
    };

    return {
      ...header,
      LINES: (lines ?? []).map((line) => ({ ...line })),
    };
  }
}
