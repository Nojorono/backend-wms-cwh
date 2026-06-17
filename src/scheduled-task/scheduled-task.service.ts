import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScheduledTask, ScheduledTaskType } from '../core/domain/entities/scheduled-task.entity';
import { ScheduledTaskPayload } from '../core/domain/types/scheduled-task-payload.interface';
import { ScheduledTaskCallbackRegistry } from './scheduled-task-callback.registry';
import { ScheduledTaskRepository } from './scheduled-task.repository';

export interface RegisterCronJobInput {
  name: string;
  cronTime: string;
  callbackType: string;
  timezone?: string;
  payload?: ScheduledTaskPayload;
  /** When false, cron runs in SchedulerRegistry only (not persisted). Default true. */
  persist?: boolean;
}

export interface ScheduledTaskActionResult {
  success: boolean;
  message: string;
}

@Injectable()
export class ScheduledTaskService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ScheduledTaskService.name);
  private readonly memoryJobs = new Map<
    string,
    Pick<RegisterCronJobInput, 'callbackType' | 'payload' | 'timezone'>
  >();

  constructor(
    private readonly repository: ScheduledTaskRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly callbackRegistry: ScheduledTaskCallbackRegistry,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const jobs = await this.repository.findAllActive();
    for (const job of jobs) {
      if (job.type === ScheduledTaskType.CRON) {
        this.registerCron(job);
        this.logger.log(`Restored cron job "${job.name}"`);
      }
    }
  }

  onApplicationShutdown(): void {
    for (const name of this.schedulerRegistry.getCronJobs().keys()) {
      try {
        this.schedulerRegistry.getCronJob(name).stop();
        this.schedulerRegistry.deleteCronJob(name);
      } catch {
        // ignore
      }
    }
  }

  getCallbackTypes(): string[] {
    return this.callbackRegistry.getCallbackTypes();
  }

  findAll(): Promise<ScheduledTask[]> {
    return this.repository.findAll();
  }

  findByName(name: string, withDeleted = false): Promise<ScheduledTask | null> {
    return this.repository.findByName(name, withDeleted);
  }

  /**
   * Register a cron job. Use `persist: false` for env-driven in-memory schedules.
   */
  async registerCronJob(input: RegisterCronJobInput): Promise<ScheduledTaskActionResult> {
    this.validateCallbackType(input.callbackType);

    const persist = input.persist !== false;

    if (persist) {
      const existing = await this.findByName(input.name, true);
      if (existing && !existing.deletedAt) {
        throw new ConflictException(`Job "${input.name}" already exists`);
      }
      if (existing?.deletedAt) {
        await this.repository.restoreByName(input.name);
        const restored = await this.findByName(input.name);
        if (restored) {
          this.registerCron(restored);
        }
        return { success: true, message: `Cron job "${input.name}" restored` };
      }
    } else {
      this.safeRemoveCron(input.name);
      this.memoryJobs.delete(input.name);
    }

    const payload = this.mergePayload(input.payload, input.timezone);

    try {
      if (persist) {
        this.mountCronJob(input.name, input.cronTime, input.timezone);
        await this.repository.create({
          name: input.name,
          type: ScheduledTaskType.CRON,
          schedule: input.cronTime,
          callbackType: input.callbackType,
          isActive: true,
          payload,
        });
      } else {
        this.memoryJobs.set(input.name, {
          callbackType: input.callbackType,
          payload: payload ?? undefined,
          timezone: input.timezone,
        });
        this.mountCronJob(input.name, input.cronTime, input.timezone);
      }

      this.logger.log(
        `Registered cron job "${input.name}" persist=${persist} callback=${input.callbackType}`,
      );
      return { success: true, message: `Cron job "${input.name}" registered` };
    } catch (error) {
      this.safeRemoveCron(input.name);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(message);
    }
  }

  /** Idempotent ensure — skips when an active job already exists (persisted only). */
  async ensureCronJob(input: RegisterCronJobInput): Promise<void> {
    const persist = input.persist !== false;

    if (!persist) {
      if (this.schedulerRegistry.doesExist('cron', input.name)) {
        return;
      }
      await this.registerCronJob({ ...input, persist: false });
      return;
    }

    const existing = await this.findByName(input.name, true);
    if (existing && !existing.deletedAt) {
      return;
    }
    if (existing?.deletedAt) {
      await this.repository.restoreByName(input.name);
      const restored = await this.findByName(input.name);
      if (restored) {
        this.registerCron(restored);
      }
      return;
    }

    await this.registerCronJob(input);
  }

  async deleteJob(name: string): Promise<ScheduledTaskActionResult> {
    const task = await this.findByName(name);
    if (!task) {
      throw new NotFoundException(`Job "${name}" not found`);
    }

    this.safeRemoveCron(name);
    await this.repository.softDeleteByName(name);
    return { success: true, message: 'Deleted' };
  }

  async hardDeleteJob(name: string): Promise<ScheduledTaskActionResult> {
    const task = await this.findByName(name, true);
    if (!task) {
      throw new NotFoundException(`Job "${name}" not found`);
    }

    this.safeRemoveCron(name);
    await this.repository.hardDeleteByName(name);
    return { success: true, message: 'Permanently deleted' };
  }

  /** Run a job immediately by name (persisted) or by callback type (in-memory / manual). */
  async runNow(input: {
    name?: string;
    callbackType?: string;
    payload?: ScheduledTaskPayload;
  }): Promise<void> {
    if (input.name) {
      await this.runJobByName(input.name);
      return;
    }

    if (!input.callbackType) {
      throw new BadRequestException('name or callbackType is required');
    }

    this.validateCallbackType(input.callbackType);
    await this.dispatchJob(this.buildSyntheticJob(`manual:${input.callbackType}`, input.callbackType, input.payload ?? null));
  }

  private buildSyntheticJob(
    name: string,
    callbackType: string,
    payload: ScheduledTaskPayload | null,
  ): ScheduledTask {
    return {
      id: 'manual',
      name,
      type: ScheduledTaskType.CRON,
      schedule: '',
      callbackType,
      isActive: true,
      payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    };
  }

  private registerCron(task: ScheduledTask): void {
    if (!task.isActive || this.schedulerRegistry.doesExist('cron', task.name)) {
      return;
    }

    const timezone = this.resolveTimezone(task.payload);
    this.mountCronJob(task.name, task.schedule, timezone);
  }

  private mountCronJob(name: string, cronTime: string, timezone?: string): void {
    this.safeRemoveCron(name);

    const cronJob = new CronJob(
      cronTime,
      () => void this.runJobByName(name),
      null,
      true,
      timezone,
    );
    this.schedulerRegistry.addCronJob(name, cronJob);
  }

  private async runJobByName(name: string): Promise<void> {
    const memoryJob = this.memoryJobs.get(name);
    if (memoryJob) {
      await this.dispatchJob(
        this.buildSyntheticJob(name, memoryJob.callbackType, memoryJob.payload ?? null),
      );
      return;
    }

    await this.runPersistedJob(name);
  }

  private async runPersistedJob(name: string): Promise<void> {
    const job = await this.findByName(name);
    if (!job?.isActive) {
      return;
    }

    await this.dispatchJob(job);
  }

  private async dispatchJob(job: ScheduledTask): Promise<void> {
    const handler = this.callbackRegistry.get(job.callbackType);
    if (!handler) {
      this.logger.warn(`No handler for callback "${job.callbackType}" (job "${job.name}")`);
      return;
    }

    try {
      await handler.execute(job);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Job "${job.name}" failed: ${message}`);
    }
  }

  private validateCallbackType(callbackType: string): void {
    if (!this.callbackRegistry.has(callbackType)) {
      throw new BadRequestException(
        `Invalid callbackType: ${callbackType}. Registered: ${this.callbackRegistry.getCallbackTypes().join(', ') || 'none'}`,
      );
    }
  }

  private mergePayload(
    payload?: ScheduledTaskPayload,
    timezone?: string,
  ): ScheduledTaskPayload | null {
    if (!payload && !timezone) {
      return null;
    }
    return { ...(payload ?? {}), ...(timezone ? { __timezone: timezone } : {}) };
  }

  private resolveTimezone(payload: ScheduledTaskPayload | null): string | undefined {
    const value = payload?.__timezone;
    return typeof value === 'string' ? value : undefined;
  }

  private safeRemoveCron(name: string): void {
    this.memoryJobs.delete(name);
    try {
      if (this.schedulerRegistry.doesExist('cron', name)) {
        this.schedulerRegistry.deleteCronJob(name);
      }
    } catch {
      // ignore
    }
  }
}
