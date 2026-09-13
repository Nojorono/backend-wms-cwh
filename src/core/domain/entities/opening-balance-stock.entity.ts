import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OpeningBalanceStockItem } from './opening-balance-stock-item.entity';

export enum OpeningBalanceStockStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum OpeningBalanceStockSource {
  MANUAL = 'MANUAL',
  EXCEL = 'EXCEL',
}

@Entity('opening_balance_stock')
export class OpeningBalanceStock extends BaseEntity {
  @Column({ nullable: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  document: string;

  @Column({ nullable: true })
  organization_id: string;

  @Column({ name: 'period_date', type: 'date', nullable: true })
  period_date: Date;

  @Column({ name: 'week_number', type: 'int', nullable: true })
  week_number: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true, default: OpeningBalanceStockStatus.DRAFT })
  status: OpeningBalanceStockStatus;

  @Column({ nullable: true, default: OpeningBalanceStockSource.MANUAL })
  source: OpeningBalanceStockSource;

  @Column({ name: 'file_name', nullable: true })
  file_name: string;

  @Column({ name: 'total_items', type: 'int', default: 0 })
  total_items: number;

  @OneToMany(
    () => OpeningBalanceStockItem,
    (openingBalanceStockItem) => openingBalanceStockItem.openingBalanceStock,
  )
  openingBalanceStockItems: OpeningBalanceStockItem[];
}
