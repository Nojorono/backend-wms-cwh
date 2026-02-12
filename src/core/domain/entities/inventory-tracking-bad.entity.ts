import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterItem } from './master-item.entity';
import { InboundRetur } from './inbound-retur.entity';
import { InventoryTracking } from './inventory-tracking.entity';

@Entity('inventory_tracking_bad')
export class InventoryTrackingBad extends BaseEntity {

  @Column({ nullable: true })
  inbound_retur_id: string;

  @ManyToOne(() => InboundRetur, (inboundRetur) => inboundRetur.id)
  @JoinColumn({ name: 'inbound_retur_id' })
  inboundRetur: InboundRetur;

  @Column({ nullable: true })
  inventory_tracking_id: string;

  @ManyToOne(() => InventoryTracking, (inventoryTracking) => inventoryTracking.id)
  @JoinColumn({ name: 'inventory_tracking_id' })
  inventoryTracking: InventoryTracking; 

  @Column({ nullable: true })
  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id)
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true })
  quantity: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ nullable: true })
  production_date: Date;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  hje: string;

  @Column({ nullable: true })
  notes: string;
}
