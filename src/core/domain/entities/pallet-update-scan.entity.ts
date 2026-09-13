import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PalletUpdate } from './pallet-update.entity';
import { MasterPallet } from './master-pallet.entity';
import { User } from './user.entity';
import { MasterItem } from './master-item.entity';

@Entity('pallet_update_scan')
export class PalletUpdateScan extends BaseEntity {
    @Column({ name: 'palletUpdateId', nullable: false })
    palletUpdateId: string;

    @ManyToOne(() => PalletUpdate, { nullable: true })
    @JoinColumn({ name: 'palletUpdateId' })
    palletUpdate: PalletUpdate;

    @Column({ name: 'scan_number', nullable: true })
    scanNumber: string;

    @Column({ name: 'scan_date', nullable: true })
    scanDate: Date;

    @Column({ name: 'scanByUserId', nullable: true })
    scanByUserId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'scanByUserId' })
    scanByUser: User;

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

    @Column({ name: 'quantity', nullable: true })
    quantity: number;

    @Column({ name: 'uom', nullable: true })
    uom: string;

    @Column({ name: 'productionDate', nullable: true })
    productionDate: Date;

    @Column({ name: 'weekNumber', type: 'int', nullable: true, default: 0 })
    weekNumber: number;

    @Column({ name: 'notes', nullable: true })
    notes: string;

    @Column({ name: 'status', nullable: true })
    status: string;
}
