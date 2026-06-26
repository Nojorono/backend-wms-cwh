import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from '../../core/helpers/rmq-connection.helper';
import { CreateMoveOrderWithLinesDto } from './dto/create-move-order-with-lines.dto';
import { FindMoveOrderByRequestNumberDto } from './dto/find-move-order-by-request-number.dto';
import { MoveOrderFindWithLinesResponseDto } from './dto/move-order-find-with-lines-response.dto';
import {
  MoveOrderWithLinesResponseDto,
} from './dto/move-order-with-lines-response.dto';

export { CreateMoveOrderWithLinesDto } from './dto/create-move-order-with-lines.dto';
export { CreateMoveOrderOracleDto } from './dto/create-move-order-oracle.dto';
export { CreateMoveOrderLineForHeaderDto } from './dto/create-move-order-line-for-header.dto';
export { FindMoveOrderByRequestNumberDto } from './dto/find-move-order-by-request-number.dto';
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
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing MOVE_ORDER_WMS_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('MOVE_ORDER_WMS_SERVICE RabbitMQ integration initialization completed');
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

      this.logger.log('==== Sending move-order-wms.create request ====');
      this.logger.log(
        JSON.stringify({
          batch_count: dtoList.length,
          request_numbers: dtoList.map((dto) => dto.REQUEST_NUMBER),
          userId,
          userName,
        }),
      );

      const response = await firstValueFrom(
        this.moveOrderClient
          .send<MoveOrderWithLinesResponseDto>('move-order-wms.create', payload)
          .pipe(
            timeout(this.REQUEST_TIMEOUT_MS),
            catchError((error) => {
              this.logger.error(
                `MOVE_ORDER_WMS_SERVICE move-order-wms.create failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.logger.log(
        `move-order-wms.create response: status=${response.status}, message=${response.message}`,
      );

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling move-order-wms.create: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        status: false,
        message: `Error in microservice: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
        statusCode: 500,
      };
    }
  }

  /** RMQ `move-order-wms.findBySourceHeaderId` — fetch header and lines by source_header_id. */
  async findMoveOrderWithLinesByRequestNumber(
    payload: FindMoveOrderByRequestNumberDto,
  ): Promise<MoveOrderFindWithLinesResponseDto> {
    try {
      await this.ensureConnection();

      const sourceHeaderId = payload.request_number?.trim();
      this.logger.log('==== Sending move-order-wms.findBySourceHeaderId request ====');
      this.logger.log(JSON.stringify({ source_header_id: sourceHeaderId }));

      const response = await firstValueFrom(
        this.moveOrderClient
          .send<MoveOrderFindWithLinesResponseDto>(
            'move-order-wms.findBySourceHeaderId',
            { source_header_id: sourceHeaderId },
          )
          .pipe(
            timeout(this.REQUEST_TIMEOUT_MS),
            catchError((error) => {
              this.logger.error(
                `MOVE_ORDER_WMS_SERVICE move-order-wms.findBySourceHeaderId failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.logger.log(
        `move-order-wms.findBySourceHeaderId response: status=${response.status}, message=${response.message}`,
      );

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling move-order-wms.findBySourceHeaderId: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        status: false,
        message: `Error in microservice: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
        statusCode: 500,
      };
    }
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
