import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  forwardRef,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScheduledTask, ScheduledTaskType } from '../core/domain/entities/scheduled-task.entity';
import { ScheduledTaskPayload } from '../core/domain/types/scheduled-task-payload.interface';
import { ScheduledCallPlanService } from './scheduled-call-plan/scheduled-call-plan.service';
import {
  SCHEDULED_CALL_PLAN_CALLBACK_TYPE,
  SCHEDULED_EMAIL_CALLBACK_TYPE,
  SCHEDULED_TASK_CALLBACK_TYPES,
  ScheduledTaskCallbackType,
} from './scheduled-task.constants';
import { ScheduledTaskRepository } from './scheduled-task.repository';

export interface ScheduledTaskActionResult {
  success: boolean;
  message: string;
}

@Injectable()
export class ScheduledTaskService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(ScheduledTaskService.name);

  constructor(
    private readonly repository: ScheduledTaskRepository,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => ScheduledCallPlanService))
    private readonly callPlanService: ScheduledCallPlanService,
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
    return [...SCHEDULED_TASK_CALLBACK_TYPES];
  }

  findAll(): Promise<ScheduledTask[]> {
    return this.repository.findAll();
  }

  findByName(name: string, withDeleted = false): Promise<ScheduledTask | null> {
    return this.repository.findByName(name, withDeleted);
  }

  async ensureCronJob(input: {
    name: string;
    cronTime: string;
    callbackType: string;
    timezone?: string;
    payload?: ScheduledTaskPayload;
  }): Promise<void> {
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

    await this.createCronJob(input);
  }

  async createCronJob(input: {
    name: string;
    cronTime: string;
    callbackType: string;
    timezone?: string;
    payload?: ScheduledTaskPayload;
  }): Promise<ScheduledTaskActionResult> {
    this.validateCallbackType(input.callbackType);
    if (input.callbackType === SCHEDULED_EMAIL_CALLBACK_TYPE && !input.payload) {
      throw new BadRequestException('payload is required for sendEmail callback');
    }

    const existing = await this.findByName(input.name, true);
    if (existing) {
      throw new ConflictException(`Job "${input.name}" already exists`);
    }

    const payload = this.mergePayload(input.payload, input.timezone);

    try {
      const cronJob = new CronJob(
        input.cronTime,
        () => void this.runJob(input.name),
        null,
        false,
        input.timezone,
      );
      this.schedulerRegistry.addCronJob(input.name, cronJob);
      cronJob.start();

      await this.repository.create({
        name: input.name,
        type: ScheduledTaskType.CRON,
        schedule: input.cronTime,
        callbackType: input.callbackType,
        isActive: true,
        payload,
      });

      this.logger.log(`Created cron job "${input.name}"`);
      return { success: true, message: `Cron job "${input.name}" created` };
    } catch (error) {
      this.safeRemoveCron(input.name);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(message);
    }
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

  private registerCron(task: ScheduledTask): void {
    if (!task.isActive || this.schedulerRegistry.doesExist('cron', task.name)) {
      return;
    }

    const timezone = this.resolveTimezone(task.payload);
    const cronJob = new CronJob(
      task.schedule,
      () => void this.runJob(task.name),
      null,
      false,
      timezone,
    );
    this.schedulerRegistry.addCronJob(task.name, cronJob);
    cronJob.start();
  }

  private async runJob(name: string): Promise<void> {
    const job = await this.findByName(name);
    if (!job?.isActive) {
      return;
    }

    try {
      if (job.callbackType === SCHEDULED_CALL_PLAN_CALLBACK_TYPE) {
        await this.callPlanService.execute(job);
        return;
      }
      this.logger.warn(`Unknown callback "${job.callbackType}" for job "${name}"`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Job "${name}" failed: ${message}`);
    }
  }

  private validateCallbackType(callbackType: string): void {
    if (!SCHEDULED_TASK_CALLBACK_TYPES.includes(callbackType as ScheduledTaskCallbackType)) {
      throw new BadRequestException(`Invalid callbackType: ${callbackType}`);
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
    try {
      if (this.schedulerRegistry.doesExist('cron', name)) {
        this.schedulerRegistry.deleteCronJob(name);
      }
    } catch {
      // ignore
    }
  }
}
