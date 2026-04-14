import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ensureRmqConnection } from '../../core/helpers/rmq-connection.helper';

export interface EmployeeMetaDtoByEmployeeNumber {
  employee_number?: string;
}

export interface EmployeeMetaResponseDto {
  data: unknown[];
  count: number;
  status: boolean;
  message: string;
}

@Injectable()
export class EmployeeIntegrationService {
  private readonly logger = new Logger(EmployeeIntegrationService.name);
  private connectionEstablished = false;
  private connectionAttempts = 0;
  private readonly MAX_CONNECTION_ATTEMPTS = 5;
  private readonly CONNECTION_RETRY_DELAY = 2000; // 2 seconds

  constructor(
    @Inject('EMPLOYEE_SERVICE')
    private readonly employeeClient: ClientProxy,
  ) { }

  async onModuleInit() {
    this.logger.log('Initializing connection to RabbitMQ employee service...');
    await this.ensureConnection();
    this.logger.log('Employee integration service initialization completed');
  }

  private async ensureConnection(): Promise<void> {
    const state = {
      connectionEstablished: this.connectionEstablished,
      connectionAttempts: this.connectionAttempts,
    };

    await ensureRmqConnection(
      this.employeeClient,
      this.logger,
      state,
      {
        maxAttempts: this.MAX_CONNECTION_ATTEMPTS,
        baseRetryDelayMs: this.CONNECTION_RETRY_DELAY,
        serviceName: 'employee',
      },
    );

    this.connectionEstablished = state.connectionEstablished;
    this.connectionAttempts = state.connectionAttempts;
  }

  async getEmployeeByEmployeeNumber(
    params?: EmployeeMetaDtoByEmployeeNumber,
  ): Promise<EmployeeMetaResponseDto> {
    try {
      this.logger.log('Sending request to employee service with params:');
      this.logger.log(JSON.stringify(params || {}));

      const timeoutMs = 30000;
      const response = await firstValueFrom(
        this.employeeClient
          .send<EmployeeMetaResponseDto>('get_meta_employee_by_employee_number', params || {})
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
        `Employee service response: status=${response.status}, count=${response.count}, dataLength=${response.data?.length || 0}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error retrieving Oracle employee: ${error.message || 'Unknown error'}`,
        error.stack,
      );
      this.connectionEstablished = false;

      return {
        data: [],
        count: 0,
        status: false,
        message: `Error in microservice: ${error.message || 'Unknown error'}`,
      };
    }
  }
}
