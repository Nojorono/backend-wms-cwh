import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterIO } from './master-io.entity';

export enum WorkScheduledDayType {
  DAY_OFF = 'DAY_OFF',
  WORKING = 'WORKING',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
}

@Entity('work_scheduled')
@Index(['calendarDate'], { unique: true, where: '"organization_id" IS NULL' })
@Index(['organizationId', 'calendarDate'], {
  unique: true,
  where: '"organization_id" IS NOT NULL',
})
export class WorkScheduled extends BaseEntity {
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization?: MasterIO;

  @Column({ name: 'calendar_date', type: 'date' })
  calendarDate: Date;

  @Column({
    name: 'day_type',
    type: 'enum',
    enum: WorkScheduledDayType,
  })
  dayType: WorkScheduledDayType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updatedBy?: string;
}
