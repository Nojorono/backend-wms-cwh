import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from '../../core/helpers/rmq-connection.helper';
import { TruckUtilQueryDto } from '../dto/truck-util-query.dto';

@Injectable()
export class TruckUtilIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(TruckUtilIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(@Inject('TRUCK_UTIL_SERVICE') private readonly truckUtilClient: ClientProxy) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing TRUCK_UTIL_SERVICE RabbitMQ integration...');
    await this.ensureConnection();
    this.logger.log('TRUCK_UTIL_SERVICE RabbitMQ integration initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(this.truckUtilClient, this.logger, state, {
      maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
      baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
      serviceName: 'truck_util_queue',
    });

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  async findAllTruckUtils(query?: TruckUtilQueryDto): Promise<unknown> {
    try {
      await this.ensureConnection();

      const queryParams: TruckUtilQueryDto = {
        search: query?.search,
        truck_utilitas: query?.truck_utilitas,
        page: query?.page,
        limit: query?.limit,
      };

      this.logger.log('Sending truck-util.findAll with params:', queryParams);

      const timeoutMs = 30000;
      const response = await firstValueFrom(
        this.truckUtilClient.send<unknown>('truck-util.findAll', queryParams).pipe(
          timeout(timeoutMs),
          catchError((error) => {
            this.logger.error(`truck-util.findAll failed: ${error.message || 'Unknown error'}`);
            this.connectionEstablished = false;
            throw error;
          }),
        ),
      );

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling truck-util.findAll: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
