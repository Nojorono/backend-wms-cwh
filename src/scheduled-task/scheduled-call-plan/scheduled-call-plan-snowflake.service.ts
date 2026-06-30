import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INDONESIA_TIMEZONE } from '../../core/utils/date-transformer.util';
import { SNOWFLAKE_CALL_PLAN_STATEMENT } from './scheduled-call-plan-snowflake.constants';
import {
  CallPlanRowData,
  ScheduledCallPlanSnowflakeFetchResult,
} from './types/scheduled-call-plan-data.interface';
import { ScheduledCallPlanFetchPayload } from './types/scheduled-call-plan-fetch-payload.interface';
import { SnowflakeStatementsResponse } from './types/snowflake-statements-response.interface';

interface SnowflakeStatementsRequest {
  statement: string;
  database: string;
  schema: string;
  warehouse: string;
  role: string;
  bindings: Record<string, { type: string; value: string }>;
}

@Injectable()
export class ScheduledCallPlanSnowflakeService {
  private readonly logger = new Logger(ScheduledCallPlanSnowflakeService.name);

  constructor(private readonly configService: ConfigService) { }

  async fetchCallPlan(
    payload: ScheduledCallPlanFetchPayload = {},
  ): Promise<ScheduledCallPlanSnowflakeFetchResult> {
    const resolvedDate = payload.callPlanStartDate?.trim() || this.resolveDefaultCallPlanStartDate();
    const response = await this.executeStatement(resolvedDate);
    const data = this.parseResponse(response);
    const totalRows = response.resultSetMetaData?.numRows ?? data.length;

    this.logger.log(
      `Fetched ${data.length} call plan row(s) for CALL_PLAN_START_DATE=${resolvedDate}`,
    );

    return {
      callPlanStartDate: resolvedDate,
      totalRows,
      data,
    };
  }

  /** Default: today in WIB + 2 days (H-2 schedule target date). */
  resolveDefaultCallPlanStartDate(): string {
    const jakartaToday = this.getJakartaDateParts(new Date());
    const target = new Date(Date.UTC(jakartaToday.year, jakartaToday.month - 1, jakartaToday.day));
    target.setUTCDate(target.getUTCDate() + 2);

    return this.formatDateParts({
      year: target.getUTCFullYear(),
      month: target.getUTCMonth() + 1,
      day: target.getUTCDate(),
    });
  }

  private async executeStatement(callPlanStartDate: string): Promise<SnowflakeStatementsResponse> {
    const statementsUrl = this.configService.get<string>('SNOWFLAKE_STATEMENTS_URL')?.trim();
    const accessToken = this.configService.get<string>('SNOWFLAKE_ACCESS_TOKEN')?.trim();

    if (!statementsUrl) {
      throw new BadRequestException('SNOWFLAKE_STATEMENTS_URL is not configured');
    }
    if (!accessToken) {
      throw new BadRequestException('SNOWFLAKE_ACCESS_TOKEN is not configured');
    }

    const body: SnowflakeStatementsRequest = {
      statement: SNOWFLAKE_CALL_PLAN_STATEMENT,
      database: this.configService.get<string>('SNOWFLAKE_DATABASE')?.trim() || 'DEV_SFA_OUTSYSTEMS',
      schema: this.configService.get<string>('SNOWFLAKE_SCHEMA')?.trim() || 'SFA',
      warehouse: this.configService.get<string>('SNOWFLAKE_WAREHOUSE')?.trim() || 'TASK_SFA',
      role: this.configService.get<string>('SNOWFLAKE_ROLE')?.trim() || 'ROLE_API',
      bindings: {
        '1': { type: 'TEXT', value: callPlanStartDate },
      },
    };

    const tokenType =
      this.configService.get<string>('SNOWFLAKE_TOKEN_TYPE')?.trim() ||
      'PROGRAMMATIC_ACCESS_TOKEN';

    const response = await fetch(statementsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Snowflake-Authorization-Token-Type': tokenType,
      },
      body: JSON.stringify(body),
    });

    const responseBody = (await response.json()) as SnowflakeStatementsResponse;

    if (!response.ok) {
      const message = responseBody.message || `Snowflake API failed with status ${response.status}`;
      this.logger.error(`Snowflake request failed: ${message}`);
      throw new BadRequestException(message);
    }

    return responseBody;
  }

  private parseResponse(response: SnowflakeStatementsResponse): CallPlanRowData[] {
    if (!response.data?.length) {
      return [];
    }

    const parsed: CallPlanRowData[] = [];

    for (const row of response.data) {
      const rawValue = row?.[0];
      if (!rawValue) {
        continue;
      }

      try {
        const item = this.normalizeCallPlanRow(JSON.parse(rawValue) as Partial<CallPlanRowData>);
        parsed.push(item);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to parse Snowflake call plan row: ${message}`);
      }
    }

    return parsed;
  }

  private normalizeCallPlanRow(item: Partial<CallPlanRowData>): CallPlanRowData {
    return {
      AHOM_NAME: this.toText(item.AHOM_NAME),
      AHOM_NIK: this.toText(item.AHOM_NIK),
      CABANG: this.toText(item.CABANG),
      ISLUARKOTA: item.ISLUARKOTA === true,
      CALL_PLAN_END_DATE: this.toText(item.CALL_PLAN_END_DATE),
      CALL_PLAN_NUMBER: this.toText(item.CALL_PLAN_NUMBER),
      CALL_PLAN_START_DATE: this.toText(item.CALL_PLAN_START_DATE),
      ROUTE_NUMBER: this.toText(item.ROUTE_NUMBER),
      SALES_NAME: this.toText(item.SALES_NAME),
      SALES_NIK: this.toText(item.SALES_NIK),
      SALES_SUPERVISOR_NAME: this.toText(item.SALES_SUPERVISOR_NAME),
      SALES_SUPERVISOR_NIK: this.toText(item.SALES_SUPERVISOR_NIK),
    };
  }

  private toText(value: string | null | undefined): string {
    return value == null ? '' : String(value).trim();
  }

  private getJakartaDateParts(date: Date): { year: number; month: number; day: number } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: INDONESIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);

    return { year, month, day };
  }

  private formatDateParts(parts: { year: number; month: number; day: number }): string {
    const month = String(parts.month).padStart(2, '0');
    const day = String(parts.day).padStart(2, '0');
    return `${parts.year}-${month}-${day}`;
  }
}
