import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MetaSalesItemDtoByBranch } from '../dto/meta-sales-item-by-branch.dto';
import { firstValueFrom, timeout, catchError } from 'rxjs';

export interface SalesItemResponseDto {
  data: any[];
  status: boolean;
  message: string;
  count?: number;
}

@Injectable()
export class SalesItemIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(SalesItemIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

  constructor(@Inject('SALES_ITEM_SERVICE') private readonly salesItemClient: ClientProxy) { }

  async onModuleInit() {
    this.logger.log('Initializing connection to RabbitMQ sales item service...');
    await this.ensureConnection();
    this.logger.log('Sales item integration service initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    if (this.connectionEstablished) {
      return;
    }

    this.connectionAttempts++;

    try {
      this.logger.log(
        `Connection attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS} to RabbitMQ sales item service...`,
      );

      await this.salesItemClient.connect();

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

  async getSalesItemsFromOracleByBranch(
    dto: MetaSalesItemDtoByBranch,
  ): Promise<SalesItemResponseDto> {
    try {
      await this.ensureConnection();

      this.logger.log('Sending request to sales item service with branch:', dto.branch);

      const timeoutMs = 30000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const salesItemResponse = await firstValueFrom(
        this.salesItemClient
          .send<SalesItemResponseDto>('sales-item.findByBranch', dto)
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(`RabbitMQ request failed: ${error.message || 'Unknown error'}`);
              this.connectionEstablished = false;
              throw error;
            }),
          ),
      );

      this.logger.log('Received response from sales item service:', {
        status: salesItemResponse?.status,
        count: salesItemResponse?.count,
        dataLength: salesItemResponse?.data?.length,
        message: salesItemResponse?.message,
      });

      const response: SalesItemResponseDto = {
        data: salesItemResponse?.data || [],
        status: salesItemResponse?.status ?? false,
        message: salesItemResponse?.message || 'No data received from sales item service',
        count: salesItemResponse?.count || salesItemResponse?.data?.length || 0,
      };

      return response;
    } catch (error) {
      this.logger.error(
        `Error getting sales items by branch ${dto.branch} via RabbitMQ:`,
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }
}
