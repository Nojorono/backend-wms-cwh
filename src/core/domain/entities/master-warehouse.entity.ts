import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InventoryTracking } from './inventory-tracking.entity';
import { MasterIO } from './master-io.entity';

@Entity('m_warehouse')
export class MasterWarehouse extends BaseEntity {
  @Column({ nullable: true })
  organization_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, name: 'locator_id' })
  locator_id: number;

  @Column({ nullable: true, name: 'locator_name' })
  locator_name: string;

  @OneToMany(() => InventoryTracking, (inventoryTracking) => inventoryTracking.warehouse)
  inventory_trackings: InventoryTracking[];
}
