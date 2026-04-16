import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from '../../core/helpers/rmq-connection.helper';

export interface InvLocatorMetaDtoParams {
    organization_code?: string;
    subinventory_code?: string;
}

export interface InvLocatorMetaResponseDto {
    statusCode: number;
    message: string;
    data: unknown[];
}

@Injectable()
export class WarehouseLocatorIntegrationService {
    private readonly logger = new Logger(WarehouseLocatorIntegrationService.name);
    private connectionEstablished = false;
    private connectionAttempts = 0;
    private readonly MAX_CONNECTION_ATTEMPTS = 5;
    private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

    constructor(
        @Inject('INV_ON_HAND_QTY_SERVICE')
        private readonly inventoryOnHandQtyClient: ClientProxy,
    ) { }

    async onModuleInit() {
        this.logger.log('Initializing connection to RabbitMQ INV_ON_HAND service...');
        await this.ensureConnection();
        this.logger.log('INV_ON_HAND integration service initialization completed');
    }

    private async ensureConnection(): Promise<void> {

        const state = {
            connectionEstablished: this.connectionEstablished,
            connectionAttempts: this.connectionAttempts,
        };

        await ensureRmqConnection(
            this.inventoryOnHandQtyClient,
            this.logger,
            state,
            {
                maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
                baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
                serviceName: 'inv_on_hand_qty_queue',
            },
        );

        this.connectionEstablished = state.connectionEstablished;
        this.connectionAttempts = state.connectionAttempts;
    }

    async getInventoryLocator(
        params?: InvLocatorMetaDtoParams,
    ): Promise<InvLocatorMetaResponseDto> {
        try {
            this.logger.log('Sending request to INV_ON_HAND service with params:');
            this.logger.log(JSON.stringify(params || {}));

            const timeoutMs = 30000;
            const response = await firstValueFrom(
                this.inventoryOnHandQtyClient
                    .send<InvLocatorMetaResponseDto>('get_inv_locator', params || {})
                    .pipe(
                        timeout(timeoutMs),
                        catchError((error) => {
                            this.logger.error(`RabbitMQ request failed: ${error.message || 'Unknown error'}`);
                            this.connectionEstablished = false;
                            throw error;
                        }),
                    ),
            );

            this.logger.log(
                `INV_ON_HAND service response: statusCode=${response.statusCode}, message=${response.message}, dataLength=${response.data?.length || 0}`,
            );
            return response;
        } catch (error) {
            this.logger.error(
                `Error retrieving Oracle INV_ON_HAND: ${error.message || 'Unknown error'}`,
                error.stack,
            );
            this.connectionEstablished = false;

            return {
                statusCode: 500,
                message: `Error in microservice: ${error.message || 'Unknown error'}`,
                data: [],
            };
        }
    }
}
