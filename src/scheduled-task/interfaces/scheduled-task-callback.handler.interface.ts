import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';

/** Pluggable handler for a persisted or in-memory scheduled job callback. */
export interface ScheduledTaskCallbackHandler {
  readonly callbackType: string;
  execute(job: ScheduledTask): Promise<void>;
}
