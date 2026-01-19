import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { CustomerMain } from '../../core/domain/entities/customer-main.entity';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

export interface CustomerMainResponseDto {
  data: CustomerMain[];
  count: number;
  status: boolean;
  message: string;
  currentPage?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable()
export class CustomerMainIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(CustomerMainIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

  constructor(
    @Inject('HR_OPERATING_UNITS_SERVICE') private readonly customerMainClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing connection to RabbitMQ HR Operating Units service...');
    await this.ensureConnection();
    this.logger.log('HR Operating Units integration service initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    if (this.connectionEstablished) {
      return;
    }

    this.connectionAttempts++;

    try {
      this.logger.log(
        `Connection attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS} to RabbitMQ HR Operating Units service...`,
      );

      await this.customerMainClient.connect();

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

  async getCustomerMains(params?: CustomerQueryDto): Promise<CustomerMainResponseDto> {
    try {
      const queryParams: CustomerQueryDto = {
        page: params?.page,
        limit: params?.limit,
      };

      this.logger.log('Sending request to HR Operating Units service with params:', queryParams);

      const timeoutMs = 30000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const customerMainResponse = await firstValueFrom(
        this.customerMainClient
          .send<CustomerMainResponseDto>('hr-operating-units.findAll', queryParams)
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(`RabbitMQ request failed: ${error.message || 'Unknown error'}`);
              this.connectionEstablished = false;
              throw error; // Let the catch block handle fallback
            }),
          ),
      );

      this.logger.log('Raw response from HR Operating Units service:', JSON.stringify(customerMainResponse));
      
      // Handle different response formats
      let responseData: any[] = [];
      let responseCount = 0;
      let responseStatus = true;
      let responseMessage = 'Success';

      // Cast to any to handle various response formats from external services
      const rawResponse = customerMainResponse as any;

      // Check if response is an array directly
      if (Array.isArray(rawResponse)) {
        responseData = rawResponse;
        responseCount = rawResponse.length;
      }
      // Check if response has data property
      else if (rawResponse && rawResponse.data) {
        responseData = Array.isArray(rawResponse.data) ? rawResponse.data : [];
        responseCount = rawResponse.data.length;
        responseStatus = rawResponse.status ?? true;
        responseMessage = rawResponse.message || 'Success';
      }
      // Check if response has rows property (Oracle format)
      else if (rawResponse && rawResponse.rows) {
        responseData = Array.isArray(rawResponse.rows) ? rawResponse.rows : [];
        responseCount = rawResponse.rows.length;
      }
      // Check if response has success and result properties
      else if (rawResponse && rawResponse.success !== undefined) {
        responseData = rawResponse.result || rawResponse.data || [];
        responseCount = responseData.length;
        responseStatus = rawResponse.success;
        responseMessage = rawResponse.message || 'Success';
      }

      this.logger.log('Parsed response from HR Operating Units service:', {
        status: responseStatus,
        count: responseCount,
        dataLength: responseData.length,
        message: responseMessage,
      });

      const response: CustomerMainResponseDto = {
        data: responseData,
        count: responseCount,
        status: responseStatus,
        message: responseMessage,
      };

      if (rawResponse?.currentPage !== undefined) {
        response.currentPage = rawResponse.currentPage;
        response.limit = rawResponse.limit;
        response.totalPages = rawResponse.totalPages;
      } else if (rawResponse?.meta) {
        response.currentPage = rawResponse.meta.page;
        response.limit = rawResponse.meta.limit;
        response.totalPages = rawResponse.meta.totalPages;
      }

      return response;
    } catch (error) {
      this.logger.error(
        'Error getting customer mains via RabbitMQ, falling back to local service:',
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }

  async getCustomerMainById(customerId: string): Promise<CustomerMainResponseDto> {
    try {
      this.logger.log(`Sending request to get HR Operating Unit by ID: ${customerId}`);

      const timeoutMs = 20000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const customerResponse = await firstValueFrom(
        this.customerMainClient
          .send<CustomerMainResponseDto>('hr-operating-units.findById', {
            id: customerId,
          })
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(`RabbitMQ request failed: ${error.message || 'Unknown error'}`);
              this.connectionEstablished = false;
              throw error; // Let the catch block handle fallback
            }),
          ),
      );

      return (
        customerResponse || {
          data: [],
          count: 0,
          status: false,
          message: 'Failed to retrieve data from HR Operating Units service (null response)',
        }
      );
    } catch (error) {
      this.logger.error(
        `Error getting HR Operating Unit by ID ${customerId} via RabbitMQ, falling back to local service:`,
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }

  async invalidateCustomerMainCache(
    customerId?: string,
  ): Promise<{ status: boolean; message: string }> {
    try {
      await this.ensureConnection();

      this.logger.log(
        `Sending request to invalidate customer main cache ${customerId ? `for ID: ${customerId}` : '(all customers)'}`,
      );

      const timeoutMs = 10000;

      const response = await firstValueFrom(
        this.customerMainClient
          .send<{ status: boolean; message: string }>('invalidate_customer_main_cache', {
            customerId,
          })
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(
                `Cache invalidation request timeout after ${timeoutMs}ms: ${error.message || 'Unknown error'}`,
              );
              return of({
                status: false,
                message: `Cache invalidation request timed out after ${timeoutMs}ms: ${error.message || 'Unknown error'}`,
              });
            }),
          ),
      );

      this.logger.log(`Cache invalidation response: ${JSON.stringify(response)}`);
      return (
        response || {
          status: false,
          message: 'Failed to invalidate cache (null response)',
        }
      );
    } catch (error) {
      this.logger.error(
        `Error invalidating customer main cache ${customerId ? `for ID ${customerId}` : '(all customers)'}:`,
        error,
      );
      return {
        status: false,
        message: `Error invalidating customer main cache: ${error?.message || 'Unknown error'}`,
      };
    }
  }
}

