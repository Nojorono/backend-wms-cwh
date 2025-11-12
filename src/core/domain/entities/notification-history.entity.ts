import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum NotificationStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

@Entity('notification_history')
@Index(['user_id', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['status'])
@Index(['entity_type', 'entity_id'])
export class NotificationHistory extends BaseEntity {
  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ nullable: true })
  entity_type: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  username: string;

  @Column({ type: 'simple-array', nullable: true })
  rooms: string[];

  @Column({ type: 'simple-array', nullable: true })
  recipients: string[];

  @Column({ 
    type: 'enum', 
    enum: NotificationStatus, 
    default: NotificationStatus.SENT 
  })
  status: NotificationStatus;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;

  @Column({ nullable: true })
  read_by: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ default: false })
  is_broadcast: boolean;

  @Column({ nullable: true })
  organization_id: string;

  @Column({ nullable: true })
  warehouse_id: string;
}

