import { Injectable, Logger } from '@nestjs/common';
import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';
import { ScheduledCallPlanEmailService } from './scheduled-call-plan-email.service';
import { ScheduledCallPlanSnowflakeService } from './scheduled-call-plan-snowflake.service';
import {
  CallPlanAhomGroupedData,
  CallPlanRowData,
  CallPlanSalesData,
  ScheduledCallPlanFetchResult,
} from './types/scheduled-call-plan-data.interface';
import { ScheduledCallPlanFetchPayload } from './types/scheduled-call-plan-fetch-payload.interface';

@Injectable()
export class ScheduledCallPlanService {
  private readonly logger = new Logger(ScheduledCallPlanService.name);

  constructor(
    private readonly snowflakeService: ScheduledCallPlanSnowflakeService,
    private readonly callPlanEmailService: ScheduledCallPlanEmailService,
  ) {}

  async runFetchNow(
    payload?: ScheduledCallPlanFetchPayload,
  ): Promise<ScheduledCallPlanFetchResult> {
    return await this.fetchCallPlan(payload ?? {});
  }

  async runFetchNowFromJob(job: ScheduledTask): Promise<ScheduledCallPlanFetchResult> {
    return await this.fetchCallPlan(this.parsePayload(job.payload));
  }

  private async fetchCallPlan(
    payload: ScheduledCallPlanFetchPayload,
  ): Promise<ScheduledCallPlanFetchResult> {
    const snowflakeResult = await this.snowflakeService.fetchCallPlan(payload);
    const data = this.groupCallPlanByAhom(snowflakeResult.data);

    const emailSummary = await this.callPlanEmailService.sendRemindersForGroupedData(
      data,
      snowflakeResult.callPlanStartDate,
    );

    this.logger.log(
      `Call plan reminders: attempted=${emailSummary.attempted} sent=${emailSummary.sent} skipped=${emailSummary.skippedMissingEmail}`,
    );

    return {
      callPlanStartDate: snowflakeResult.callPlanStartDate,
      totalRows: snowflakeResult.totalRows,
      data,
    };
  }

  private groupCallPlanByAhom(rows: CallPlanRowData[]): CallPlanAhomGroupedData[] {
    const ahomMap = new Map<string, CallPlanAhomGroupedData>();

    for (const row of rows) {
      const ahomKey = `${row.AHOM_NIK}|${row.CABANG}`;
      let ahomGroup = ahomMap.get(ahomKey);

      if (!ahomGroup) {
        ahomGroup = {
          AHOM_NAME: row.AHOM_NAME,
          AHOM_NIK: row.AHOM_NIK,
          CABANG: row.CABANG,
          SALES_SPV: [],
        };
        ahomMap.set(ahomKey, ahomGroup);
      }

      const spvKey = row.SALES_SUPERVISOR_NIK;
      let spvGroup = ahomGroup.SALES_SPV.find((spv) => spv.SALES_SUPERVISOR_NIK === spvKey);

      if (!spvGroup) {
        spvGroup = {
          SALES_SUPERVISOR_NAME: row.SALES_SUPERVISOR_NAME,
          SALES_SUPERVISOR_NIK: row.SALES_SUPERVISOR_NIK,
          SALES: [],
        };
        ahomGroup.SALES_SPV.push(spvGroup);
      }

      spvGroup.SALES.push(this.toSalesData(row));
    }

    return Array.from(ahomMap.values());
  }

  private toSalesData(row: CallPlanRowData): CallPlanSalesData {
    return {
      SALES_NAME: row.SALES_NAME,
      SALES_NIK: row.SALES_NIK,
      CALL_PLAN_END_DATE: row.CALL_PLAN_END_DATE,
      CALL_PLAN_NUMBER: row.CALL_PLAN_NUMBER,
      CALL_PLAN_START_DATE: row.CALL_PLAN_START_DATE,
      ROUTE_NUMBER: row.ROUTE_NUMBER,
      ISLUARKOTA: row.ISLUARKOTA,
    };
  }

  private parsePayload(payload: ScheduledTask['payload']): ScheduledCallPlanFetchPayload {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const parsed = payload as ScheduledCallPlanFetchPayload;

    return {
      callPlanStartDate:
        typeof parsed.callPlanStartDate === 'string' ? parsed.callPlanStartDate : undefined,
    };
  }
}
