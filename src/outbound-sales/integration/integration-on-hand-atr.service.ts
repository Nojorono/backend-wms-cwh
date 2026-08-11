import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';
import {
  InvOnHandQtyWithAtrParamsDto,
  InvOnHandQtyWithAtrResponseDto,
} from '../dto/inv-on-hand-qty-with-atr.dto';
import {
  LocatorSalesParamsDto,
  LocatorSalesResponseDto,
} from '../dto/locator-sales.dto';
import {
  InventoryLocatorParamsDto,
  InventoryLocatorResponseDto,
} from '../dto/inventory-locator.dto';

export {
  InvOnHandQtyWithAtrParamsDto,
  InvOnHandQtyWithAtrResponseDto,
  LocatorSalesParamsDto,
  LocatorSalesResponseDto,
  InventoryLocatorParamsDto,
  InventoryLocatorResponseDto,
};

@Injectable()
export class IntegrationOnHandAtrService implements OnModuleInit {
  private readonly logger = new Logger(IntegrationOnHandAtrService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000;

  constructor(
    @Inject('INV_ON_HAND_QTY_SERVICE')
    private readonly invOnHandQtyClient: ClientProxy,
  ) { }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing INV_ON_HAND_QTY_SERVICE on-hand ATR integration...');
    await this.ensureConnection();
    this.logger.log('INV_ON_HAND_QTY_SERVICE on-hand ATR integration initialization completed');
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
   * RMQ `get_inv_on_hand_qty_with_atr` — inventory on-hand quantity with Oracle attributes.
   */
  async getInvOnHandQtyWithAtr(
    params: InvOnHandQtyWithAtrParamsDto,
  ): Promise<InvOnHandQtyWithAtrResponseDto> {
    try {
      await this.ensureConnection();

      this.logger.log(
        '==== Sending request for inventory on hand quantity with attributes ====',
      );
      this.logger.log(JSON.stringify(params || {}));

      const timeoutMs = 30000;
      const response = await firstValueFrom(
        this.invOnHandQtyClient
          .send<InvOnHandQtyWithAtrResponseDto>(
            'get_inv_on_hand_qty_with_atr',
            params ?? {},
          )
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `INV_ON_HAND_QTY_SERVICE get_inv_on_hand_qty_with_atr failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.logger.log(
        `get_inv_on_hand_qty_with_atr response: status=${response.status}, count=${response.count ?? response.data?.length ?? 0}`,
      );

      return response;
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling get_inv_on_hand_qty_with_atr: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        data: [],
        count: 0,
        status: false,
        message: `Error in microservice: ${error instanceof Error ? error.message : String(error)}`,
        statusCode: 500,
      };
    }
  }

  /**
   * RMQ `get_locator_sales` — locator sales lookup by organization and salesrep.
   */
  async getLocatorSales(
    params: LocatorSalesParamsDto,
  ): Promise<LocatorSalesResponseDto> {
    try {
      await this.ensureConnection();

      this.logger.log('==== Sending request for locator sales with params ====');
      this.logger.log(JSON.stringify(params || {}));

      const timeoutMs = 30000;
      const response = await firstValueFrom(
        this.invOnHandQtyClient
          .send<LocatorSalesResponseDto>('get_locator_sales', params ?? {})
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `INV_ON_HAND_QTY_SERVICE get_locator_sales failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.logger.log(
        `get_locator_sales response: status=${response.status ?? response.statusCode}, count=${response.count ?? response.data?.length ?? 0}`,
      );

      return {
        ...response,
        status: response.status ?? response.statusCode === 200,
        count: response.count ?? response.data?.length ?? 0,
      };
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling get_locator_sales: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        data: [],
        count: 0,
        status: false,
        message: `Error in microservice: ${error instanceof Error ? error.message : String(error)}`,
        statusCode: 500,
      };
    }
  }

  /**
   * RMQ `get_inv_locator` — Oracle inventory locator list.
   */
  async getInventoryLocator(
    params?: InventoryLocatorParamsDto,
  ): Promise<InventoryLocatorResponseDto> {
    try {
      await this.ensureConnection();

      this.logger.log(
        '==== Sending request for Oracle inventory locator list with params ====',
      );
      this.logger.log(JSON.stringify(params || {}));

      const timeoutMs = 30000;
      const response = await firstValueFrom(
        this.invOnHandQtyClient
          .send<InventoryLocatorResponseDto>('get_inv_locator', params ?? {})
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `INV_ON_HAND_QTY_SERVICE get_inv_locator failed: ${error.message || 'Unknown error'}`,
              );
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.logger.log(
        `get_inv_locator response: status=${response.status ?? response.statusCode}, count=${response.count ?? response.data?.length ?? 0}, dataLength=${response.data?.length ?? 0}`,
      );

      return {
        ...response,
        status: response.status ?? response.statusCode === 200,
        count: response.count ?? response.data?.length ?? 0,
      };
    } catch (error) {
      this.connectionEstablished = false;
      this.logger.error(
        `Error calling get_inv_locator: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        data: [],
        count: 0,
        status: false,
        message: `Error in microservice: ${error instanceof Error ? error.message : String(error)}`,
        statusCode: 500,
      };
    }
  }
}
