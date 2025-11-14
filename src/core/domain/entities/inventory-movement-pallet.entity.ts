import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InventoryMovement } from './inventory-movement.entity';
import { MasterPallet } from './master-pallet.entity';
import { InventoryTracking } from './inventory-tracking.entity';

@Entity('inventory_movement_pallet')
export class InventoryMovementPallet extends BaseEntity {
  @Column({ nullable: true })
  inventory_movement_id: string;

  @ManyToOne(() => InventoryMovement, (movement) => movement.pallets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_movement_id' })
  inventoryMovement: InventoryMovement;

  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id)
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({ nullable: true })
  inventory_tracking_id: string;

  @ManyToOne(() => InventoryTracking, (tracking) => tracking.id)
  @JoinColumn({ name: 'inventory_tracking_id' })
  inventoryTracking: InventoryTracking;

  @Column({ nullable: true, default: false })
  is_completed: boolean;

  @Column({ nullable: true })
  completed_at: Date;
}

