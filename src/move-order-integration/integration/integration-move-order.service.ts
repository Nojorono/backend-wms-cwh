import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from '../../core/helpers/rmq-connection.helper';
import { CreateMoveOrderWithLinesDto } from './dto/create-move-order-with-lines.dto';
import { FindMoveOrderByRequestNumberDto } from './dto/find-move-order-by-request-number.dto';
import { MoveOrderFindWithLinesResponseDto } from './dto/move-order-find-with-lines-response.dto';
import {
  MoveOrderCreateWithLinesRmqPayload,
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
  MoveOrderCreateWithLinesRmqPayload,
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
    @Inject('MOVE_ORDER_SERVICE')
    private readonly moveOrderClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing MOVE_ORDER_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('MOVE_ORDER_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.moveOrderClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'move_order_queue',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  /**
   * RMQ `move_order.create_with_lines` — create Oracle move order header and lines.
   */
  async createMoveOrderWithLines(
    createDto: CreateMoveOrderWithLinesDto,
    userId?: number,
    userName?: string,
  ): Promise<MoveOrderWithLinesResponseDto> {
    try {
      await this.ensureConnection();

      const payload: MoveOrderCreateWithLinesRmqPayload = {
        createDto,
        userId,
        userName,
      };

      this.logger.log('==== Sending move_order.create_with_lines request ====');
      this.logger.log(
        JSON.stringify({
          request_number: createDto.REQUEST_NUMBER,
          organization_id: createDto.ORGANIZATION_ID,
          line_count: createDto.lines?.length ?? 0,
          userId,
          userName,
        }),
      );

      const response = await firstValueFrom(
        this.moveOrderClient
          .send<MoveOrderWithLinesResponseDto>('move_order.create_with_lines', payload)
          .pipe(
            timeout(this.REQUEST_TIMEOUT_MS),
            catchError((error) => {
              this.logger.error(
                `MOVE_ORDER_SERVICE move_order.create_with_lines failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.logger.log(
        `move_order.create_with_lines response: status=${response.status}, message=${response.message}`,
      );

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling move_order.create_with_lines: ${error instanceof Error ? error.message : String(error)}`,
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

  /**
   * RMQ `move_order.find_by_request_number` — fetch Oracle move order header and lines.
   */
  async findMoveOrderWithLinesByRequestNumber(
    payload: FindMoveOrderByRequestNumberDto,
  ): Promise<MoveOrderFindWithLinesResponseDto> {
    try {
      await this.ensureConnection();

      this.logger.log('==== Sending move_order.find_by_request_number request ====');
      this.logger.log(JSON.stringify(payload));

      const response = await firstValueFrom(
        this.moveOrderClient
          .send<MoveOrderFindWithLinesResponseDto>(
            'move_order.find_by_request_number',
            payload,
          )
          .pipe(
            timeout(this.REQUEST_TIMEOUT_MS),
            catchError((error) => {
              this.logger.error(
                `MOVE_ORDER_SERVICE move_order.find_by_request_number failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.logger.log(
        `move_order.find_by_request_number response: status=${response.status}, message=${response.message}`,
      );

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling move_order.find_by_request_number: ${error instanceof Error ? error.message : String(error)}`,
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
}
