import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('m_item')
export class MasterItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  item_number: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'inventory_item_id', nullable: true })
  inventory_item_id: string;

  @Column({ name: 'dus_per_stack', nullable: true })
  dus_per_stack: number;

  @Column({ name: 'bal_per_dus', nullable: true })
  bal_per_dus: number;

  @Column({ name: 'press_per_bal', nullable: true })
  press_per_bal: number;

  @Column({ name: 'bks_per_press', nullable: true })
  bks_per_press: number;

  @Column({ name: 'btg_per_bks', nullable: true })
  btg_per_bks: number;

  @Column({ nullable: true })
  organization_id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 