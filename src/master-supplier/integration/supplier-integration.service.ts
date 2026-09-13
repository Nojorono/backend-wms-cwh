import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SupplierQueryDto } from '../dto/supplier-query.dto';
import { firstValueFrom, timeout, catchError } from 'rxjs';

@Injectable()
export class SupplierIntegrationService implements OnModuleInit {
    private readonly logger = new Logger(SupplierIntegrationService.name);
    private connectionEstablished = false;
    private connectionAttempts = 0;
    private readonly MAX_CONNECTION_ATTEMPTS = 5;
    private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

    constructor(@Inject('SUPPLIER_SERVICE') private readonly supplierClient: ClientProxy) { }

    async onModuleInit() {
        this.logger.log('Initializing connection to RabbitMQ supplier service...');
        await this.ensureConnection();
        this.logger.log('Supplier integration service initialization completed');
    }

    private async ensureConnection(): Promise<void> {
        if (this.connectionEstablished) {
            return;
        }

        this.connectionAttempts++;

        try {
            this.logger.log(
                `Connection attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS} to RabbitMQ supplier service...`,
            );

            await this.supplierClient.connect();

            this.logger.log('RabbitMQ connection established successfully');
            this.connectionEstablished = true;
        } catch (error) {
            this.logger.error(
                `Failed to establish connection to RabbitMQ: ${error?.message || 'Unknown error'}`,
            );

            if (this.connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
                const delay = this.CONNECTION_RETRY_DELAY * Math.pow(1.5, this.connectionAttempts - 1);
                this.logger.log(`Retrying connection in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.ensureConnection();
            } else {
                this.logger.error(
                    `Maximum connection attempts (${this.MAX_CONNECTION_ATTEMPTS}) reached. Service will work in fallback mode.`,
                );
                this.connectionAttempts = 0;
                // Don't throw error, allow service to work in fallback mode
            }
        }
    }

    async getAllSuppliersByAttribute7(params?: SupplierQueryDto): Promise<any> {
        try {
            const queryParams: SupplierQueryDto = {
                SEARCH: params?.SEARCH || undefined,
                ATTRIBUTE7: params?.ATTRIBUTE7 || undefined,
            };

            this.logger.log('Sending request to supplier service with params:', queryParams);

            const timeoutMs = 30000;
            this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

            const supplierResponse = await firstValueFrom(
                this.supplierClient.send<any>('supplier.findAll', queryParams).pipe(
                    timeout(timeoutMs),
                    catchError((error) => {
                        this.logger.error(`RabbitMQ request failed: ${error.message || 'Unknown error'}`);
                        this.connectionEstablished = false;
                        throw error; // Let the catch block handle fallback
                    }),
                ),
            );

            this.logger.log('Received response from supplier service:', {
                data: supplierResponse,
            });

            return supplierResponse;
        } catch (error) {
            this.logger.error(
                'Error getting suppliers via RabbitMQ, falling back to local service:',
                error,
            );
            this.connectionEstablished = false;
            throw error;
        }
    }
}
