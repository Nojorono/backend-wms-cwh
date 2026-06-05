import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OpeningBalanceStock } from './opening-balance-stock.entity';
import { MasterItem } from './master-item.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterWarehouseSub } from './master-warehouse-sub.entity';
import { MasterWarehouseBin } from './master-warehouse-bin.entity';

@Entity('opening_balance_stock_item')
export class OpeningBalanceStockItem extends BaseEntity {
  @Column({ nullable: true })
  opening_balance_stock_id: string;

  @ManyToOne(
    () => OpeningBalanceStock,
    (openingBalanceStock) => openingBalanceStock.openingBalanceStockItems,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'opening_balance_stock_id' })
  openingBalanceStock: OpeningBalanceStock;

  // Business reference codes (authoritative input — entered by user / Excel).
  @Column({ name: 'item_code', nullable: true })
  item_code: string;

  @Column({ name: 'warehouse_sub_code', nullable: true })
  warehouse_sub_code: string;

  @Column({ name: 'warehouse_bin_code', nullable: true })
  warehouse_bin_code: string;

  @Column({ name: 'pallet_code', nullable: true })
  pallet_code: string;

  // Resolved master references (filled server-side from the codes above).
  @Column({ nullable: true })
  item_id: string;

  @ManyToOne(() => MasterItem, (item) => item.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'item_id' })
  item: MasterItem;

  @Column({ nullable: true })
  warehouse_sub_id: string;

  @ManyToOne(() => MasterWarehouseSub, (warehouseSub) => warehouseSub.id, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'warehouse_sub_id' })
  warehouseSub: MasterWarehouseSub;

  @Column({ nullable: true })
  warehouse_bin_id: string;

  @ManyToOne(() => MasterWarehouseBin, (warehouseBin) => warehouseBin.id, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'warehouse_bin_id' })
  warehouseBin: MasterWarehouseBin;

  @Column({ nullable: true })
  pallet_id: string;

  @ManyToOne(() => MasterPallet, (pallet) => pallet.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pallet_id' })
  pallet: MasterPallet;

  @Column({ type: 'int', nullable: true })
  quantity: number;

  @Column({ nullable: true })
  uom: string;

  @Column({ name: 'production_date', type: 'date', nullable: true })
  production_date: Date;

  @Column({ name: 'week_number', type: 'int', nullable: true })
  week_number: number;

  @Column({ nullable: true })
  notes: string;
}
