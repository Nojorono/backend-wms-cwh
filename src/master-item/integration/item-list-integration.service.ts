import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ItemListQueryDto } from '../dto/item-list-query.dto';
import { MasterItem } from '../../core/domain/entities/master-item.entity';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

export interface ItemListResponseDto {
  data: MasterItem[];
  count: number;
  status: boolean;
  message: string;
  currentPage?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable()
export class ItemListIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(ItemListIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

  constructor(@Inject('ITEM_LIST_SERVICE') private readonly itemListClient: ClientProxy) {}

  async onModuleInit() {
    this.logger.log('Initializing connection to RabbitMQ item list service...');
    await this.ensureConnection();
    this.logger.log('Item list integration service initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    if (this.connectionEstablished) {
      return;
    }

    this.connectionAttempts++;

    try {
      this.logger.log(
        `Connection attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_ATTEMPTS} to RabbitMQ item list service...`,
      );

      await this.itemListClient.connect();

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

  async getItemLists(params?: ItemListQueryDto): Promise<ItemListResponseDto> {
    try {
      const queryParams: ItemListQueryDto = {
        search: params?.search || undefined,
        page: params?.page,
        limit: params?.limit,
        sortBy: params?.sortBy || 'created_at',
        sortOrder: params?.sortOrder || 'desc',
      };

      this.logger.log('Sending request to item list service with params:', queryParams);

      const timeoutMs = 30000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const itemListResponse = await firstValueFrom(
        this.itemListClient.send<ItemListResponseDto>('item-list.findAll', queryParams).pipe(
          timeout(timeoutMs),
          catchError((error) => {
            this.logger.error(`RabbitMQ request failed: ${error.message || 'Unknown error'}`);
            this.connectionEstablished = false;
            throw error; // Let the catch block handle fallback
          }),
        ),
      );

      this.logger.log('Received response from item list service:', {
        status: itemListResponse?.status,
        count: itemListResponse?.count,
        dataLength: itemListResponse?.data?.length,
        message: itemListResponse?.message,
      });

      const response: ItemListResponseDto = {
        data: itemListResponse?.data || [],
        count: itemListResponse?.count || 0,
        status: itemListResponse?.status ?? false,
        message: itemListResponse?.message || 'No data received from item list service',
      };

      if (itemListResponse?.currentPage !== undefined) {
        response.currentPage = itemListResponse.currentPage;
        response.limit = itemListResponse.limit;
        response.totalPages = itemListResponse.totalPages;
      }

      return response;
    } catch (error) {
      this.logger.error(
        'Error getting item lists via RabbitMQ, falling back to local service:',
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }

  async getItemListById(itemId: string): Promise<ItemListResponseDto> {
    try {
      this.logger.log(`Sending request to get item by ID: ${itemId}`);

      const timeoutMs = 20000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const itemResponse = await firstValueFrom(
        this.itemListClient
          .send<ItemListResponseDto>('item-list.findById', {
            id: itemId,
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
        itemResponse || {
          data: [],
          count: 0,
          status: false,
          message: 'Failed to retrieve data from item list service (null response)',
        }
      );
    } catch (error) {
      this.logger.error(
        `Error getting item by ID ${itemId} via RabbitMQ, falling back to local service:`,
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }

  async searchItemLists(searchTerm: string): Promise<ItemListResponseDto> {
    try {
      this.logger.log(`Sending search request for term: ${searchTerm}`);

      const timeoutMs = 30000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const searchResponse = await firstValueFrom(
        this.itemListClient
          .send<ItemListResponseDto>('item-list.search', {
            search: searchTerm,
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

      this.logger.log('Received search response from item list service:', {
        status: searchResponse?.status,
        count: searchResponse?.count,
        dataLength: searchResponse?.data?.length,
        message: searchResponse?.message,
      });

      const response: ItemListResponseDto = {
        data: searchResponse?.data || [],
        count: searchResponse?.count || 0,
        status: searchResponse?.status ?? false,
        message: searchResponse?.message || 'No search results received from item list service',
      };

      return response;
    } catch (error) {
      this.logger.error(
        'Error searching item lists via RabbitMQ, falling back to local service:',
        error,
      );
      this.connectionEstablished = false;

      throw error;
    }
  }

  async invalidateItemListCache(itemId?: string): Promise<{ status: boolean; message: string }> {
    try {
      await this.ensureConnection();

      this.logger.log(
        `Sending request to invalidate item list cache ${itemId ? `for ID: ${itemId}` : '(all items)'}`,
      );

      const timeoutMs = 10000;

      const response = await firstValueFrom(
        this.itemListClient
          .send<{ status: boolean; message: string }>('invalidate_item_list_cache', {
            itemId,
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
        `Error invalidating item list cache ${itemId ? `for ID ${itemId}` : '(all items)'}:`,
        error,
      );
      return {
        status: false,
        message: `Error invalidating item list cache: ${error?.message || 'Unknown error'}`,
      };
    }
  }
}
