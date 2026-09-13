import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DoValidationDto, DoValidationQueryDto } from '../dto/do-validation.dto';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { ensureRmqConnection } from 'src/core/helpers/rmq-connection.helper';

export interface DoValidationResponseDto {
  data: DoValidationDto[];
  count: number;
  status: boolean;
  message: string;
  currentPage?: number;
  limit?: number;
  totalPages?: number;
}

@Injectable()
export class DoValidationIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(DoValidationIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

  constructor(@Inject('DO_VALIDATION_SERVICE') private readonly doValidationClient: ClientProxy) { }

  async onModuleInit() {
    this.logger.log('Initializing connection to RabbitMQ do validation service...');
    await this.ensureConnection();
    this.logger.log('Do validation integration service initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(
      this.doValidationClient,
      this.logger,
      state,
      {
        maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
        baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
        serviceName: 'do_validation',
      },
    );

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  async getItemLists(params?: DoValidationQueryDto): Promise<DoValidationResponseDto> {
    try {
      const queryParams: DoValidationQueryDto = {
        no_surat_jalan: params?.no_surat_jalan || undefined,
        page: params?.page,
        limit: params?.limit,
      };

      this.logger.log(
        'Sending request to do validation integration service with params:',
        queryParams,
      );

      const timeoutMs = 30000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const doValidationResponse = await firstValueFrom(
        this.doValidationClient
          .send<DoValidationResponseDto>('do_validation_find_all', queryParams)
          .pipe(
            timeout(timeoutMs),
            catchError((error) => {
              this.logger.error(`RabbitMQ request failed: ${error.message || 'Unknown error'}`);
              this.connectionEstablished = false;
              throw error; // Let the catch block handle fallback
            }),
          ),
      );

      this.logger.log('Received response from do validation integration service:', {
        status: doValidationResponse?.status,
        count: doValidationResponse?.count,
        dataLength: doValidationResponse?.data?.length,
        message: doValidationResponse?.message,
      });

      const response: DoValidationResponseDto = {
        data: doValidationResponse?.data || [],
        count: doValidationResponse?.count || 0,
        status: doValidationResponse?.status ?? false,
        message:
          doValidationResponse?.message ||
          'No data received from do validation integration service',
      };

      if (doValidationResponse?.currentPage !== undefined) {
        response.currentPage = doValidationResponse.currentPage;
        response.limit = doValidationResponse.limit;
        response.totalPages = doValidationResponse.totalPages;
      }

      return response;
    } catch (error) {
      this.logger.error(
        'Error getting do validations via RabbitMQ, falling back to local integration service:',
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }

  async getDoValidation(
    suratJalan: string,
    type: string,
  ): Promise<{ data_so: DoValidationDto[]; data_po: DoValidationDto[] }> {
    if (type === 'SO') {
      const response = await this.getDoValidationBySuratJalanSO(suratJalan);
      return {
        data_so: response.data || [],
        data_po: [],
      };
    }

    const response = await this.getDoValidationBySuratJalan(suratJalan);
    return {
      data_so: [],
      data_po: response.data || [],
    };
  }

  async getDoValidationBySuratJalan(suratJalan: string): Promise<DoValidationResponseDto> {
    try {
      this.logger.log(
        `Sending request to get do validation integration by surat jalan: ${suratJalan}`,
      );

      const timeoutMs = 20000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const doValidationResponse = await firstValueFrom(
        this.doValidationClient
          .send<DoValidationResponseDto>('do_validation_find_by_no_surat_jalan', {
            noSuratJalan: suratJalan,
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
        doValidationResponse || {
          data: [],
          count: 0,
          status: false,
          message: 'Failed to retrieve data from do validation integration service (null response)',
        }
      );
    } catch (error) {
      this.logger.error(
        `Error getting do validation integration by surat jalan ${suratJalan} via RabbitMQ, falling back to local integration service:`,
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }


  async getDoValidationBySuratJalanSO(suratJalan: string): Promise<any> {
    try {
      this.logger.log(
        `Sending request to get do validation integration by surat jalan: ${suratJalan}`,
      );

      const timeoutMs = 20000;
      this.logger.log(`Using timeout of ${timeoutMs}ms for RabbitMQ request`);

      const doValidationResponse = await firstValueFrom(
        this.doValidationClient
          .send<any>('do_validation_find_by_surat_jalan_so', {
            noSuratJalan: suratJalan,
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
        doValidationResponse || {
          data: [],
          count: 0,
          status: false,
          message: 'Failed to retrieve data from do validation integration service (null response)',
        }
      );
    } catch (error) {
      this.logger.error(
        `Error getting do validation integration by surat jalan ${suratJalan} via RabbitMQ, falling back to local integration service:`,
        error,
      );
      this.connectionEstablished = false;
      throw error;
    }
  }
}
