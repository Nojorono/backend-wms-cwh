import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { PalletUpdateItem } from './pallet-update-item.entity';
import { PalletUpdateScan } from './pallet-update-scan.entity';
import { PalletUpdateAssigned } from './pallet-update-assigned.entity';

/**
 * Update types per flowchart:
 * - UPDATE_PROD_CODE_UOM: staff scan pallet → update code/UOM → auto-update WMS. No helper, no inspection.
 * - SPLIT_PALLET: one source → multiple destinations at lokasi asal; one SKU per scan (persatu satu). Helper + inspection.
 * - MERGE_PALLET: multiple sources → one destination. Helper + inspection.
 */
export enum PalletUpdateType {
  UPDATE_PROD_CODE_UOM = 'UPDATE_PROD_CODE_UOM',
  SPLIT_PALLET = 'SPLIT_PALLET',
  MERGE_PALLET = 'MERGE_PALLET',
}

export enum PalletUpdateStatus {
  PENDING_ASSIGNMENT = 'PENDING_ASSIGNMENT',
  PENDING_HELPER_ACTION = 'PENDING_HELPER_ACTION',
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InspectionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('pallet_update')
export class PalletUpdate extends BaseEntity {
  /** Unique reference (e.g. IPU-YYYY-NNNN). Generate when creating; required for Split/Merge. */
  @Column({ name: 'update_number', nullable: true, unique: true })
  updateNumber: string;

  @Column({
    name: 'update_type',
    type: 'enum',
    enum: PalletUpdateType,
    nullable: false,
  })
  updateType: PalletUpdateType;

  @Column({ name: 'uom', nullable: true })
  uom: string;

  @Column({ name: 'production_code', nullable: true })
  productionCode: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: PalletUpdateStatus,
    default: PalletUpdateStatus.PENDING_ASSIGNMENT,
  })
  status: PalletUpdateStatus;

  @Column({ name: 'initiated_by_user_id', nullable: false })
  initiatedByUserId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'initiated_by_user_id' })
  initiatedByUser: User;

  @Column({
    name: 'inspection_status',
    type: 'enum',
    enum: InspectionStatus,
    nullable: true,
  })
  inspectionStatus: InspectionStatus;

  @Column({ name: 'inspection_by_user_id', nullable: true })
  inspectionByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'inspection_by_user_id' })
  inspectionByUser: User;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'completed_date', nullable: true })
  completedDate: Date;

  @OneToMany(
    () => PalletUpdateItem,
    (item: PalletUpdateItem) => item.palletUpdate,
    { cascade: true },
  )
  items: PalletUpdateItem[];

  @OneToMany(
    () => PalletUpdateScan,
    (scan: PalletUpdateScan) => scan.palletUpdate,
    { cascade: true },
  )
  scans: PalletUpdateScan[];

  @OneToMany(
    () => PalletUpdateAssigned,
    (assigned: PalletUpdateAssigned) => assigned.palletUpdate,
    { cascade: true },
  )
  assigned: PalletUpdateAssigned[];
}
