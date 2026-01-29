import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InboundRetur } from './inbound-retur.entity';
import { MasterItem } from './master-item.entity';

export enum InboundReturSortingStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
}

@Entity('inbound_retur_sorting')
export class InboundReturSorting extends BaseEntity {
    @Column({ nullable: true })
    inbound_retur_id: string;

    @ManyToOne(() => InboundRetur, (inboundRetur) => inboundRetur.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inbound_retur_id' })
    inbound_retur: InboundRetur;

    @Column({ nullable: true })
    item_id: string;

    @ManyToOne(() => MasterItem, (item) => item.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'item_id' })
    item: MasterItem;

    @Column({ nullable: true })
    quantity_claim: number;

    @Column({ nullable: true })
    quantity_unclaim: number;

    @Column({ nullable: true })
    quantity_tracking: number;

    @Column({ nullable: true })
    uom: string;

    @Column({ nullable: true })
    hje: string;

    @Column({ nullable: true })
    year: string;

    @Column({ nullable: true })
    notes: string;

    @Column({ nullable: true, default: InboundReturSortingStatus.PENDING })
    status: InboundReturSortingStatus;
}
