import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InventoryTracking } from './inventory-tracking.entity';
import { MasterWarehouseBin } from './master-warehouse-bin.entity';
import { User } from './user.entity';
import { Inbound } from './inbound.entity';
import { MasterIO } from './master-io.entity';

export enum Status {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('transaction_put_away')
export class PutAwayTransaction extends BaseEntity {
  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ nullable: true })
  inventory_tracking_id: string;

  @ManyToOne(() => InventoryTracking, (inventoryTracking) => inventoryTracking.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'inventory_tracking_id' })
  inventoryTracking: InventoryTracking;

  @Column({ nullable: true })
  destination_bin_id: string;

  @ManyToOne(() => MasterWarehouseBin, (warehouseBin) => warehouseBin.id)
  @JoinColumn({ name: 'destination_bin_id' })
  destinationBin: MasterWarehouseBin;

  @Column({ nullable: true })
  forklift_driver_id: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'forklift_driver_id' })
  forkliftDriver: User;

  @Column({ nullable: true })
  driver_name: string;

  @Column({ nullable: true })
  driver_phone: string;

  @Column({ nullable: true })
  status: Status;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  week_number: number;

  @Column({ nullable: true })
  production_date: Date;

  @Column({ nullable: true })
  inbound_id: string;

  @ManyToOne(() => Inbound, (inbound) => inbound.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound;

}
