import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';
import { CreateShipConfirmInternalDto } from '../dto/create-ship-confirm-internal.dto';
import { CreateShipConfirmSubdistOracleDto } from '../dto/create-ship-confirm-subdist-oracle.dto';
import { ShipConfirmInternalFindDto } from '../dto/ship-confirm-internal-find.dto';
import { ShipConfirmInternalResponseDto } from './dto/ship-confirm-internal-response.dto';

export { CreateShipConfirmInternalDto, ShipConfirmInternalFindDto, ShipConfirmInternalResponseDto };

@Injectable()
export class ShipConfirmIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(ShipConfirmIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(
    @Inject('SHIP_CONFIRM_SERVICE')
    private readonly shipConfirmClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing SHIP_CONFIRM_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('SHIP_CONFIRM_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.shipConfirmClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'ship_confirm_queue',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  /**
   * RMQ `shipconfirm.create` — accepts single payload or array (microservice normalizes to array).
   */
  async create(
    payloads: CreateShipConfirmInternalDto[] | CreateShipConfirmSubdistOracleDto[],
  ): Promise<ShipConfirmInternalResponseDto> {
    try {
      await this.ensureConnection();
      const timeoutMs = 30000;

      return await firstValueFrom(
        this.shipConfirmClient
          .send<ShipConfirmInternalResponseDto>('shipconfirm.create', payloads ?? [])
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `SHIP_CONFIRM_SERVICE create failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling shipconfirm.create: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /** RMQ `shipconfirm.find` — lookup by source_header_id, iso_header_id, and/or transaction_type. */
  async find(payload: ShipConfirmInternalFindDto): Promise<ShipConfirmInternalResponseDto> {
    try {
      await this.ensureConnection();
      const timeoutMs = 30000;

      return await firstValueFrom(
        this.shipConfirmClient
          .send<ShipConfirmInternalResponseDto>('shipconfirm.find', payload)
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `SHIP_CONFIRM_SERVICE find failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling shipconfirm.find: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
