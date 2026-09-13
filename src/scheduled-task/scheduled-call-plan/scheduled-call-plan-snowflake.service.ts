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

interface SnowflakeAuthContext {
  accessToken: string;
  tokenType: string;
  statementsUrl: string;
}

@Injectable()
export class ScheduledCallPlanSnowflakeService {
  private readonly logger = new Logger(ScheduledCallPlanSnowflakeService.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchCallPlan(
    payload: ScheduledCallPlanFetchPayload = {},
  ): Promise<ScheduledCallPlanSnowflakeFetchResult> {
    const resolvedDate = payload.callPlanStartDate?.trim() || this.resolveDefaultCallPlanStartDate();
    const auth = this.resolveAuthContext();
    const initialResponse = await this.executeStatement(resolvedDate, auth);
    const allRows = await this.fetchAllPartitionRows(initialResponse, auth);
    const data = this.parseRows(allRows);
    const totalRows = initialResponse.resultSetMetaData?.numRows ?? data.length;

    this.logger.log(
      `Fetched ${data.length}/${totalRows} call plan row(s) for CALL_PLAN_START_DATE=${resolvedDate}`,
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

  private resolveAuthContext(): SnowflakeAuthContext {
    const statementsUrl = this.configService.get<string>('SNOWFLAKE_STATEMENTS_URL')?.trim();
    const accessToken = this.configService.get<string>('SNOWFLAKE_ACCESS_TOKEN')?.trim();

    if (!statementsUrl) {
      throw new BadRequestException('SNOWFLAKE_STATEMENTS_URL is not configured');
    }
    if (!accessToken) {
      throw new BadRequestException('SNOWFLAKE_ACCESS_TOKEN is not configured');
    }

    const tokenType =
      this.configService.get<string>('SNOWFLAKE_TOKEN_TYPE')?.trim() ||
      'PROGRAMMATIC_ACCESS_TOKEN';

    return { accessToken, tokenType, statementsUrl };
  }

  private async executeStatement(
    callPlanStartDate: string,
    auth: SnowflakeAuthContext,
  ): Promise<SnowflakeStatementsResponse> {
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

    return this.requestSnowflake<SnowflakeStatementsResponse>(auth, {
      method: 'POST',
      url: auth.statementsUrl,
      body: JSON.stringify(body),
    });
  }

  private async fetchAllPartitionRows(
    initialResponse: SnowflakeStatementsResponse,
    auth: SnowflakeAuthContext,
  ): Promise<string[][]> {
    const mergedRows: string[][] = [...(initialResponse.data ?? [])];
    const partitionInfo = initialResponse.resultSetMetaData?.partitionInfo ?? [];

    if (partitionInfo.length <= 1) {
      return mergedRows;
    }

    const statementHandle = this.resolveStatementHandle(initialResponse, auth.statementsUrl);
    if (!statementHandle) {
      this.logger.warn(
        `Snowflake returned ${partitionInfo.length} partitions but no statement handle; ` +
          `using partition 0 only (${mergedRows.length} row(s))`,
      );
      return mergedRows;
    }

    this.logger.log(
      `Fetching Snowflake partitions 1..${partitionInfo.length - 1} for handle=${statementHandle}`,
    );

    for (let partition = 1; partition < partitionInfo.length; partition++) {
      const partitionResponse = await this.fetchStatementPartition(
        auth,
        statementHandle,
        partition,
      );
      const rows = partitionResponse.data ?? [];
      mergedRows.push(...rows);
      this.logger.log(
        `Fetched Snowflake partition=${partition} rows=${rows.length} ` +
          `(expected=${partitionInfo[partition]?.rowCount ?? 'unknown'})`,
      );
    }

    return mergedRows;
  }

  private async fetchStatementPartition(
    auth: SnowflakeAuthContext,
    statementHandle: string,
    partition: number,
  ): Promise<SnowflakeStatementsResponse> {
    const baseUrl = auth.statementsUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/${statementHandle}?partition=${partition}`;

    return this.requestSnowflake<SnowflakeStatementsResponse>(auth, {
      method: 'GET',
      url,
    });
  }

  private resolveStatementHandle(
    response: SnowflakeStatementsResponse,
    statementsUrl: string,
  ): string | undefined {
    if (response.statementHandle?.trim()) {
      return response.statementHandle.trim();
    }

    const statusUrl = response.statementStatusUrl?.trim();
    if (!statusUrl) {
      return undefined;
    }

    const normalizedStatementsUrl = statementsUrl.replace(/\/+$/, '');
    const path = statusUrl.startsWith(normalizedStatementsUrl)
      ? statusUrl.slice(normalizedStatementsUrl.length)
      : statusUrl;

    const handle = path.replace(/^\//, '').split('?')[0]?.trim();
    return handle || undefined;
  }

  private async requestSnowflake<T>(
    auth: SnowflakeAuthContext,
    init: { method: 'GET' | 'POST'; url: string; body?: string },
  ): Promise<T> {
    const response = await fetch(init.url, {
      method: init.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
        'X-Snowflake-Authorization-Token-Type': auth.tokenType,
      },
      body: init.body,
    });

    const responseBody = (await response.json()) as T & { message?: string };

    if (!response.ok) {
      const message =
        responseBody.message || `Snowflake API failed with status ${response.status}`;
      this.logger.error(`Snowflake request failed (${init.method} ${init.url}): ${message}`);
      throw new BadRequestException(message);
    }

    return responseBody;
  }

  private parseRows(rows: string[][]): CallPlanRowData[] {
    if (!rows.length) {
      return [];
    }

    const parsed: CallPlanRowData[] = [];

    for (const row of rows) {
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
