import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterItem } from './master-item.entity';
import { MasterPallet } from './master-pallet.entity';

export enum AdjustmentStockType {
    PHYSICAL_FIT = 'PHYSICAL_FIT',
    PHYSICAL_WMS_FIT = 'PHYSICAL_WMS_FIT',
    PHYSICAL_META_FIT = 'PHYSICAL_META_FIT',
}

export enum AdjustmentStockApprovalStatus {
    PENDING = 'PENDING',
    APPROVED_MANAGER = 'APPROVED_MANAGER',
    APPROVED_HEAD_OF_SCM = 'APPROVED_HEAD_OF_SCM',
    REJECTED_MANAGER = 'REJECTED_MANAGER',
    REJECTED_HEAD_OF_SCM = 'REJECTED_HEAD_OF_SCM',
    CANCELLED = 'CANCELLED',
}

export enum AdjustmentStockIsInventory {
    GOOD_STOCK = 'GOOD_STOCK',
    BAD_STOCK = 'BAD_STOCK',
}

@Entity('adjustment_stock')
export class AdjustmentStock extends BaseEntity {

    @Column({ nullable: true })
    document: string;

    @Column({ nullable: true })
    type: AdjustmentStockType;

    @Column({ nullable: true })
    code: string;

    @Column({ nullable: true })
    pallet_id: string;

    @ManyToOne(() => MasterPallet, (pallet) => pallet.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pallet_id' })
    pallet: MasterPallet;

    @Column({ nullable: true })
    item_id: string;

    @ManyToOne(() => MasterItem, (item) => item.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'item_id' })
    item: MasterItem;

    @Column({ nullable: true })
    quantity: number;

    @Column({ nullable: true })
    uom: string;

    @Column({ nullable: true })
    notes: string;

    @Column({ nullable: true })
    status: AdjustmentStockApprovalStatus;

    @Column({ nullable: true })
    is_inventory: AdjustmentStockIsInventory;
}
