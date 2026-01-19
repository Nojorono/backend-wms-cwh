import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum UserActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  CANCEL = 'CANCEL',
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD',
  SEARCH = 'SEARCH',
  FILTER = 'FILTER',
  CUSTOM = 'CUSTOM',
}

export enum UserActivityStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

@Entity('users_activity')
@Index(['user_id', 'createdAt'])
@Index(['entity_type', 'entity_id'])
@Index(['action', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['ip_address'])
export class UsersActivity extends BaseEntity {
  @Column({ nullable: true })
  user_id: string;

  @Column({ nullable: true })
  username: string;

  @Column({
    type: 'enum',
    enum: UserActivityAction,
    nullable: false,
  })
  action: UserActivityAction;

  @Column({ nullable: true })
  entity_type: string;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  request_data: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  response_data: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({
    type: 'enum',
    enum: UserActivityStatus,
    default: UserActivityStatus.SUCCESS,
  })
  status: UserActivityStatus;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ nullable: true })
  endpoint: string;

  @Column({ nullable: true })
  method: string;

  @Column({ type: 'int', nullable: true })
  response_time_ms: number;

  @Column({ nullable: true })
  organization_id: string;

  @Column({ nullable: true })
  warehouse_id: string;
}

