import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { CustomerSubdist } from '../../core/domain/entities/customer-subdist.entity';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

export interface CustomerSubdistResponseDto {
  data: CustomerSubdist[];
  count: number;
  status: boolean;
  message: string;
  currentPage?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable()
export class CustomerSubdistIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(CustomerSubdistIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

  constructor(
    @Inject('AR_CUSTOMERS_SD_SERVICE') private readonly customerSubdistClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing connection to RabbitMQ AR Customers SD service...');
    await this.ensureConnection();
    this.logger.log('AR Customers SD integration service initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    if (this.connectionEstablished) {
      return;
    }

    this.connectionAttempts++;

    try {
      this.logger.log(
        `Connection attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS} to RabbitMQ AR Customers SD service...`,
      );

      await this.customerSubdistClient.connect();

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

  async getCustomerSubdists(params?: CustomerQueryDto): Promise<CustomerSubdistResponseDto> {
    try {
      const queryParams: CustomerQueryDto = {
        page: params?.page,
        limit: params?.limit,
      };

      this.logger.log('Sending request to AR Customers SD service with params:', queryParams);

      const timeoutMs = 30000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const customerSubdistResponse = await firstValueFrom(
        this.customerSubdistClient
          .send<CustomerSubdistResponseDto>('ar-customers-sd.findAll', queryParams)
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(`RabbitMQ request failed: ${error.message || 'Unknown error'}`);
              this.connectionEstablished = false;
              throw error; // Let the catch block handle fallback
            }),
          ),
      );

      this.logger.log('Raw response from AR Customers SD service:', JSON.stringify(customerSubdistResponse));
      
      // Handle different response formats
      let responseData: any[] = [];
      let responseCount = 0;
      let responseStatus = true;
      let responseMessage = 'Success';

      // Cast to any to handle various response formats from external services
      const rawResponse = customerSubdistResponse as any;

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

      this.logger.log('Parsed response from AR Customers SD service:', {
        status: responseStatus,
        count: responseCount,
        dataLength: responseData.length,
        message: responseMessage,
      });

      const response: CustomerSubdistResponseDto = {
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
        'Error getting customer subdists via RabbitMQ, falling back to local service:',
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }

  async getCustomerSubdistById(customerId: string): Promise<CustomerSubdistResponseDto> {
    try {
      this.logger.log(`Sending request to get AR Customer SD by ID: ${customerId}`);

      const timeoutMs = 20000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const customerResponse = await firstValueFrom(
        this.customerSubdistClient
          .send<CustomerSubdistResponseDto>('ar-customers-sd.findById', {
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
          message: 'Failed to retrieve data from AR Customers SD service (null response)',
        }
      );
    } catch (error) {
      this.logger.error(
        `Error getting AR Customer SD by ID ${customerId} via RabbitMQ, falling back to local service:`,
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }
  
  async invalidateCustomerSubdistCache(
    customerId?: string,
  ): Promise<{ status: boolean; message: string }> {
    try {
      await this.ensureConnection();

      this.logger.log(
        `Sending request to invalidate customer subdist cache ${customerId ? `for ID: ${customerId}` : '(all customers)'}`,
      );

      const timeoutMs = 10000;

      const response = await firstValueFrom(
        this.customerSubdistClient
          .send<{ status: boolean; message: string }>('invalidate_customer_subdist_cache', {
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
        `Error invalidating customer subdist cache ${customerId ? `for ID ${customerId}` : '(all customers)'}:`,
        error,
      );
      return {
        status: false,
        message: `Error invalidating customer subdist cache: ${error?.message || 'Unknown error'}`,
      };
    }
  }
}

