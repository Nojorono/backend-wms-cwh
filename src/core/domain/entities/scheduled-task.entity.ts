import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ScheduledTaskPayload } from '../types/scheduled-task-payload.interface';

export enum ScheduledTaskType {
  CRON = 'cron',
  INTERVAL = 'interval',
  TIMEOUT = 'timeout',
}

@Entity('scheduled_tasks')
@Index(['name'], { unique: true })
export class ScheduledTask extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar' })
  type: ScheduledTaskType;

  @Column()
  schedule: string;

  @Column({ name: 'callback_type' })
  callbackType: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  payload: ScheduledTaskPayload | null;
}
