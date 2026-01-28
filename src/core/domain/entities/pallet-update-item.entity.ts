import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PalletUpdate } from './pallet-update.entity';
import { MasterPallet } from './master-pallet.entity';
import { MasterItem } from './master-item.entity';

@Entity('pallet_update_item')
export class PalletUpdateItem extends BaseEntity {
  @Column({ name: 'palletUpdateId', nullable: false })
  palletUpdateId: string;

  @ManyToOne(
    () => PalletUpdate,
    (update) => update.items,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'palletUpdateId' })
  palletUpdate: PalletUpdate;

  @Column({ name: 'sequence', type: 'int', nullable: true, default: 1 })
  sequence: number;

  @Column({ name: 'palletId', nullable: true })
  palletId: string;

  @ManyToOne(() => MasterPallet, { nullable: true })
  @JoinColumn({ name: 'palletId' })
  pallet: MasterPallet;

  @Column({ name: 'itemId', nullable: true })
  itemId: string;

  @ManyToOne(() => MasterItem, { nullable: true })
  @JoinColumn({ name: 'itemId' })
  item: MasterItem;

  @Column({ name: 'quantity', type: 'int', nullable: true, default: 0 })
  quantity: number;

  @Column({ name: 'uom', nullable: true })
  uom: string;

  @Column({ name: 'productionDate', nullable: true })
  productionDate: Date;

  @Column({ name: 'weekNumber', type: 'int', nullable: true, default: 0 })
  weekNumber: number;
}
