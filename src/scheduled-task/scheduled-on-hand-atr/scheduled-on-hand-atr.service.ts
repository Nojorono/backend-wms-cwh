import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MasterIO } from '../../core/domain/entities/master-io.entity';
import { MasterIOService } from '../../master-io/master-io.service';
import { InvOnHandQtyWithAtrParamsDto } from '../../outbound-sales/dto/inv-on-hand-qty-with-atr.dto';
import { OutboundSalesService } from '../../outbound-sales/outbound-sales.service';
import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';
import {
  SCHEDULED_ON_HAND_ATR_BRANCH_ORGANIZATION_TYPES,
} from './scheduled-on-hand-atr.constants';
import {
  ScheduledOnHandAtrBranchResult,
  ScheduledOnHandAtrFetchResult,
} from './types/scheduled-on-hand-atr-data.interface';
import { ScheduledOnHandAtrFetchPayload } from './types/scheduled-on-hand-atr-fetch-payload.interface';

@Injectable()
export class ScheduledOnHandAtrService {
  private readonly logger = new Logger(ScheduledOnHandAtrService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly masterIOService: MasterIOService,
    private readonly outboundSalesService: OutboundSalesService,
  ) {}

  async runFetchNow(
    payload?: ScheduledOnHandAtrFetchPayload,
  ): Promise<ScheduledOnHandAtrFetchResult> {
    return await this.fetchOnHandForAllBranches(payload ?? {});
  }

  async runFetchNowFromJob(job: ScheduledTask): Promise<ScheduledOnHandAtrFetchResult> {
    return await this.fetchOnHandForAllBranches(this.parsePayload(job.payload));
  }

  private async fetchOnHandForAllBranches(
    payload: ScheduledOnHandAtrFetchPayload,
  ): Promise<ScheduledOnHandAtrFetchResult> {
    const date = this.resolveSnapshotDate(payload.date);
    const subinventoryCode = this.resolveSubinventoryCode(payload.subinventory_code);
    const createdBy = payload.created_by?.trim() || 'SYSTEM';
    const organizationTypes = this.resolveOrganizationTypes(payload.organization_types);

    const branches = await this.resolveBranches(organizationTypes);
    const branchResults: ScheduledOnHandAtrBranchResult[] = [];
    let totalRows = 0;
    let processedBranches = 0;
    let skippedBranches = 0;
    let failedBranches = 0;

    for (const branch of branches) {
      const cabang = branch.organization_name?.trim() ?? '';
      const organizationId = branch.id;

      if (!cabang) {
        skippedBranches += 1;
        branchResults.push({
          cabang: branch.organization_name ?? branch.id,
          organization_id: organizationId,
          organization_name: branch.organization_name,
          organization_type: branch.organization_type,
          row_count: 0,
          status: 'skipped',
          message: 'Missing organization_code (cabang)',
        });
        continue;
      }

      const query: InvOnHandQtyWithAtrParamsDto = {
        organization_code: branch.organization_name,
        subinventory_code: subinventoryCode,
        date,
        created_by: createdBy,
      };

      try {
        const rows = await this.outboundSalesService.findOnHand(query, organizationId);
        processedBranches += 1;
        totalRows += rows.length;
        branchResults.push({
          cabang,
          organization_id: organizationId,
          organization_name: branch.organization_name,
          organization_type: branch.organization_type,
          row_count: rows.length,
          status: 'success',
        });

        this.logger.log(
          `On-hand ATR fetched cabang=${cabang} organization_id=${organizationId} rows=${rows.length} date=${date}`,
        );
      } catch (error) {
        failedBranches += 1;
        const message = error instanceof Error ? error.message : String(error);
        branchResults.push({
          cabang,
          organization_id: organizationId,
          organization_name: branch.organization_name,
          organization_type: branch.organization_type,
          row_count: 0,
          status: 'failed',
          message,
        });

        this.logger.error(
          `On-hand ATR failed cabang=${cabang} organization_id=${organizationId}: ${message}`,
        );
      }
    }

    return {
      date,
      subinventory_code: subinventoryCode,
      total_branches: branches.length,
      processed_branches: processedBranches,
      skipped_branches: skippedBranches,
      failed_branches: failedBranches,
      total_rows: totalRows,
      branches: branchResults,
    };
  }

  private async resolveBranches(organizationTypes: string[]): Promise<MasterIO[]> {
    const branches = await this.masterIOService.findAll({
      organization_type: organizationTypes.join(','),
      end_date_active: 'null',
    });

    return branches.filter(
      (branch) => Boolean(branch.organization_code?.trim()) && Boolean(branch.id),
    );
  }

  private resolveOrganizationTypes(value?: string | string[]): string[] {
    if (Array.isArray(value)) {
      const normalized = value.map((entry) => entry.trim()).filter(Boolean);
      return normalized.length ? normalized : [...SCHEDULED_ON_HAND_ATR_BRANCH_ORGANIZATION_TYPES];
    }

    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
    }

    return [...SCHEDULED_ON_HAND_ATR_BRANCH_ORGANIZATION_TYPES];
  }

  private resolveSubinventoryCode(
    value?: string | string[],
  ): string | string[] {
    if (Array.isArray(value)) {
      const normalized = value.map((entry) => entry.trim()).filter(Boolean);
      if (normalized.length) {
        return normalized.length === 1 ? normalized[0] : normalized;
      }
    } else if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    const fromEnv = this.configService.get<string>('ON_HAND_ATR_DEFAULT_SUBINVENTORY')?.trim();
    if (fromEnv) {
      if (fromEnv.includes(',')) {
        return fromEnv
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean);
      }
      return fromEnv;
    }

    throw new BadRequestException(
      'subinventory_code is required (payload or ON_HAND_ATR_DEFAULT_SUBINVENTORY env)',
    );
  }

  private resolveSnapshotDate(value?: string): string {
    const raw = value?.trim() || new Date().toISOString().split('T')[0];
    const normalizedDate = raw.split('T')[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    if (Number.isNaN(new Date(`${normalizedDate}T00:00:00Z`).getTime())) {
      throw new BadRequestException('date must be a valid date');
    }

    return normalizedDate;
  }

  private parsePayload(payload: ScheduledTask['payload']): ScheduledOnHandAtrFetchPayload {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const parsed = payload as ScheduledOnHandAtrFetchPayload;

    return {
      date: typeof parsed.date === 'string' ? parsed.date : undefined,
      subinventory_code: parsed.subinventory_code,
      created_by: typeof parsed.created_by === 'string' ? parsed.created_by : undefined,
      organization_types: Array.isArray(parsed.organization_types)
        ? parsed.organization_types
        : typeof parsed.organization_types === 'string'
          ? parsed.organization_types
          : undefined,
    };
  }
}
