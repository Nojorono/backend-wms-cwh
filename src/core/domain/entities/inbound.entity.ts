import { Entity, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { InboundDo } from './inbound-do.entity';
import { BaseEntity } from './base.entity';
import { AssignedHelper } from './assigned-helper.entity';
import { TransactionScanInbound } from './transaction-scan-inbound.entity';
import { MasterIO } from './master-io.entity';

export enum InboundStatus {
  CREATED = 'CREATED',
  UNLOADING = 'UNLOADING',
  INSPECTION = 'INSPECTION',
  READY_INTEGRATION = 'READY_INTEGRATION',
  INTEGRATED = 'INTEGRATED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

@Entity('inbound')
export class Inbound extends BaseEntity {
  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ nullable: true })
  inbound_id_reference: string;

  @Column({ nullable: true })
  photo_license_plate: string;

  @Column({ nullable: true })
  photo_seal: string;

  @Column({ nullable: true })
  photo_condition: string;

  @Column({ nullable: true })
  inbound_number: string;

  @Column({ nullable: true })
  expedition: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  license_plate: string;

  @Column({ nullable: true })
  driver_name: string;

  @Column({ nullable: true })
  driver_phone: string;

  @Column({ nullable: true })
  status: InboundStatus;

  @Column({ nullable: true })
  inbound_type: string;

  @Column({ nullable: true })
  arrival_date: Date;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => InboundDo, (inboundDo) => inboundDo.inbound)
  inbound_dos: InboundDo[];

  @OneToMany(() => AssignedHelper, (assignedHelper) => assignedHelper.inbound)
  assigned_helpers: AssignedHelper[];

  @OneToMany(
    () => TransactionScanInbound,
    (transactionScanInbound) => transactionScanInbound.inbound,
  )
  transaction_scan_inbounds: TransactionScanInbound[];
}
