import { AdjustmentStock } from "./adjustment_stock.entity";
import { MasterItem } from "./master-item.entity";
import { MasterPallet } from "./master-pallet.entity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { MasterWarehouseSub } from "./master-warehouse-sub.entity";
import { MasterWarehouseBin } from "./master-warehouse-bin.entity";
import { BaseEntity } from "./base.entity";

@Entity('adjustment_stock_item')
export class AdjustmentStockItem extends BaseEntity {

    @Column({ nullable: true })
    adjustment_stock_id: string;

    @ManyToOne(() => AdjustmentStock, (adjustmentStock) => adjustmentStock.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'adjustment_stock_id' })
    adjustmentStock: AdjustmentStock;

    @Column({ nullable: true })
    warehouse_sub_id: string;

    @ManyToOne(() => MasterWarehouseSub, (warehouseSub) => warehouseSub.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouse_sub_id' })
    warehouseSub: MasterWarehouseSub;

    @Column({ nullable: true })
    warehouse_bin_id: string;

    @ManyToOne(() => MasterWarehouseBin, (warehouseBin) => warehouseBin.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'warehouse_bin_id' })
    warehouseBin: MasterWarehouseBin;

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
}