import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterWarehouse } from './master-warehouse.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';
import { MasterWarehouseBin } from './master-warehouse-bin.entity';
import { InventoryMovementPallet } from './inventory-movement-pallet.entity';
import { InventoryMovementUser } from './inventory-movment-user.entity';

export enum MovementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('inventory_movement')
export class InventoryMovement extends BaseEntity {
  @Column({ nullable: true })
  movement_number: string;

  @OneToMany(() => InventoryMovementPallet, (pallet) => pallet.inventoryMovement, {
    cascade: true,
  })
  pallets: InventoryMovementPallet[];

  @OneToMany(() => InventoryMovementUser, (user) => user.inventoryMovement, {
    cascade: true,
  })
  users: InventoryMovementUser[];

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
  completed_date: Date;

  @Column({ nullable: true })
  notes: string;
}

