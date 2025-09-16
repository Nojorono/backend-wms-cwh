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

  constructor(
    @Inject('WEEK_SALES_SERVICE')
    private readonly weekSalesClient: ClientProxy,
  ) {}

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
