import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AdjustmentStockItem } from './adjustment_stock_item.entity';

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
    notes: string;

    @Column({ nullable: true })
    status: AdjustmentStockApprovalStatus;

    @Column({ nullable: true })
    is_inventory: AdjustmentStockIsInventory;

    @OneToMany(() => AdjustmentStockItem, (adjustmentStockItem) => adjustmentStockItem.adjustmentStock)
    adjustmentStockItems: AdjustmentStockItem[];
}
