import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DoSuggestion, DoSuggestionStatus } from '../../core/domain/entities/do-suggestion.entity';
import {
  DoSuggestionPendingSubmissionFilters,
  DoSuggestionRepository,
} from '../../do-suggestion/do-suggestion.repository';
import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';
import {
  ScheduledSpbSubmittedSubmitResult,
  ScheduledSpbSubmittedSuggestionResult,
} from './types/scheduled-spb-submitted-data.interface';
import { ScheduledSpbSubmittedSubmitPayload } from './types/scheduled-spb-submitted-submit-payload.interface';
import { resolveSubmittedQty } from './spb-submitted.util';

@Injectable()
export class ScheduledSpbSubmittedService {
  private readonly logger = new Logger(ScheduledSpbSubmittedService.name);

  constructor(private readonly doSuggestionRepository: DoSuggestionRepository) {}

  async runSubmitNow(
    payload?: ScheduledSpbSubmittedSubmitPayload,
  ): Promise<ScheduledSpbSubmittedSubmitResult> {
    return await this.submitPendingSuggestions(payload ?? {});
  }

  async runSubmitNowFromJob(job: ScheduledTask): Promise<ScheduledSpbSubmittedSubmitResult> {
    return await this.submitPendingSuggestions(this.parsePayload(job.payload));
  }

  private async submitPendingSuggestions(
    payload: ScheduledSpbSubmittedSubmitPayload,
  ): Promise<ScheduledSpbSubmittedSubmitResult> {
    const updatedBy = payload.updated_by?.trim() || 'SYSTEM';
    const filters = this.buildFilters(payload);
    const pending = await this.doSuggestionRepository.findPendingForSubmission(filters);

    const suggestions: ScheduledSpbSubmittedSuggestionResult[] = [];
    const errors: Array<{ do_suggestion_id: string; message: string }> = [];
    let submittedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    let updatedLines = 0;

    for (const suggestion of pending) {
      try {
        const result = await this.submitSingleSuggestion(suggestion, updatedBy);
        if (result.updated_lines === 0 && !suggestion.details?.length) {
          skippedCount += 1;
          continue;
        }

        submittedCount += 1;
        updatedLines += result.updated_lines;
        suggestions.push(result);
      } catch (error) {
        failedCount += 1;
        const message = error instanceof Error ? error.message : String(error);
        errors.push({ do_suggestion_id: suggestion.id, message });
        this.logger.error(
          `Failed to submit DO suggestion ${suggestion.id}: ${message}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    this.logger.log(
      `SPB submit completed pending=${pending.length} submitted=${submittedCount} ` +
        `skipped=${skippedCount} failed=${failedCount} lines=${updatedLines}`,
    );

    return {
      total_pending: pending.length,
      submitted_count: submittedCount,
      skipped_count: skippedCount,
      failed_count: failedCount,
      updated_lines: updatedLines,
      suggestions,
      errors,
    };
  }

  private async submitSingleSuggestion(
    suggestion: DoSuggestion,
    updatedBy: string,
  ): Promise<ScheduledSpbSubmittedSuggestionResult> {
    const previousStatus = suggestion.status ?? null;
    const lines = (suggestion.details ?? []).map((detail) => ({
      id: detail.id,
      item_qty_submitted: resolveSubmittedQty(detail) ?? undefined,
    }));

    let spbNumber = suggestion.spb_number?.trim() || undefined;
    if (!spbNumber) {
      if (!suggestion.callplan_number?.trim() || !suggestion.callplan_date_start) {
        throw new BadRequestException(
          `DO suggestion ${suggestion.id} is missing callplan_number or callplan_date_start for SPB number generation`,
        );
      }

      spbNumber = await this.doSuggestionRepository.generateNextSpbNumber(
        suggestion.callplan_number,
        suggestion.callplan_date_start,
      );
    }

    await this.doSuggestionRepository.update(suggestion.id, {
      status: DoSuggestionStatus.SUBMITTED,
      updated_by: updatedBy,
      spb_number: spbNumber,
      spb_date: suggestion.spb_date ?? suggestion.callplan_date_start ?? undefined,
      lines,
    });

    return {
      do_suggestion_id: suggestion.id,
      callplan_number: suggestion.callplan_number ?? null,
      spb_number: spbNumber,
      previous_status: previousStatus,
      updated_lines: lines.length,
    };
  }

  private buildFilters(
    payload: ScheduledSpbSubmittedSubmitPayload,
  ): DoSuggestionPendingSubmissionFilters {
    const filters: DoSuggestionPendingSubmissionFilters = {};

    if (payload.callplan_date_start?.trim()) {
      const parsed = new Date(payload.callplan_date_start.trim().split('T')[0]);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException(
          `Invalid callplan_date_start: ${payload.callplan_date_start}`,
        );
      }
      filters.callplanDateStart = parsed;
    }

    return filters;
  }

  private parsePayload(raw: unknown): ScheduledSpbSubmittedSubmitPayload {
    if (!raw || typeof raw !== 'object') {
      return {};
    }

    const payload = raw as Record<string, unknown>;
    return {
      callplan_date_start:
        typeof payload.callplan_date_start === 'string' ? payload.callplan_date_start : undefined,
      updated_by: typeof payload.updated_by === 'string' ? payload.updated_by : undefined,
    };
  }
}
