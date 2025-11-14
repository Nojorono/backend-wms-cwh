import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterWarehouse } from './master-warehouse.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';
import { MasterWarehouseBin } from './master-warehouse-bin.entity';
import { InventoryMovementPallet } from './inventory-movement-pallet.entity';

export enum MovementStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('inventory_movement')
export class InventoryMovement extends BaseEntity {
  @OneToMany(() => InventoryMovementPallet, (pallet) => pallet.inventoryMovement, {
    cascade: true,
  })
  pallets: InventoryMovementPallet[];

  @Column({ nullable: true })
  source_warehouse_id: string;

  @ManyToOne(() => MasterWarehouse, (warehouse) => warehouse.id)
  @JoinColumn({ name: 'source_warehouse_id' })
  sourceWarehouse: MasterWarehouse;

  @Column({ nullable: true })
  source_warehouse_sub_id: string;

  @ManyToOne(() => MasterWarehouseSub, (warehouseSub) => warehouseSub.id)
  @JoinColumn({ name: 'source_warehouse_sub_id' })
  sourceWarehouseSub: MasterWarehouseSub;

  @Column({ nullable: true })
  source_bin_id: string;

  @ManyToOne(() => MasterWarehouseBin, (warehouseBin) => warehouseBin.id)
  @JoinColumn({ name: 'source_bin_id' })
  sourceBin: MasterWarehouseBin;

  @Column({ nullable: true })
  destination_warehouse_id: string;

  @ManyToOne(() => MasterWarehouse, (warehouse) => warehouse.id)
  @JoinColumn({ name: 'destination_warehouse_id' })
  destinationWarehouse: MasterWarehouse;

  @Column({ nullable: true })
  destination_warehouse_sub_id: string;

  @ManyToOne(() => MasterWarehouseSub, (warehouseSub) => warehouseSub.id)
  @JoinColumn({ name: 'destination_warehouse_sub_id' })
  destinationWarehouseSub: MasterWarehouseSub;

  @Column({ nullable: true })
  destination_bin_id: string;

  @ManyToOne(() => MasterWarehouseBin, (warehouseBin) => warehouseBin.id)
  @JoinColumn({ name: 'destination_bin_id' })
  destinationBin: MasterWarehouseBin;

  @Column({ nullable: true, default: MovementStatus.PENDING })
  status: MovementStatus;

  @Column({ nullable: true })
  assigned_user_id: string;

  @Column({ nullable: true })
  assigned_user_name: string;

  @Column({ nullable: true })
  movement_date: Date;

  @Column({ nullable: true })
  completed_date: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  moved_by: string;
}

