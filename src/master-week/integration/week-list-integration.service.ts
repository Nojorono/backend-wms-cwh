import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export interface WeekListResponseDto {
  status: boolean;
  message: string;
  data: any[];
}

export interface WeekSalesResponseDto {
  status: boolean;
  message: string;
  data: any[];
}

@Injectable()
export class WeekListIntegrationService {
  private readonly logger = new Logger(WeekListIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

  constructor(
    @Inject('WEEK_SALES_SERVICE')
    private readonly weekSalesClient: ClientProxy,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing connection to RabbitMQ week sales service...');
    await this.ensureConnection();
    this.logger.log('Week sales integration service initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    if (this.connectionEstablished) {
      return;
    }

    this.connectionAttempts++;

    try {
      this.logger.log(
        `Connection attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS} to RabbitMQ week sales service...`,
      );

      await this.weekSalesClient.connect();

      this.logger.log('RabbitMQ connection established successfully');
      this.connectionEstablished = true;
    } catch (error) {
      this.logger.error(
        `Failed to establish connection to RabbitMQ: ${error?.message || 'Unknown error'}`,
      );

      if (this.connectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
        const delay =
          this.CONNECTION_RETRY_DELAY *
          Math.pow(1.5, this.connectionAttempts - 1);
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
  

  async getWeekSalesAll(params?: { tahun?: string; search?: string; page?: number; limit?: number }): Promise<WeekSalesResponseDto> {
    try {
      this.logger.log(`Fetching week sales from external service with params:`, params);
      
      const response = await firstValueFrom(
        this.weekSalesClient.send('week_sales.findAll', params || {}),
      );

      this.logger.log(`Successfully fetched ${response.data?.length || 0} week sales`);
      
      return response;
    } catch (error) {
      this.logger.error('Error fetching week sales:', error);
      return {
        status: false,
        message: 'Failed to fetch week sales',
        data: [],
      };
    }
  }
}
