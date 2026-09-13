import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InboundRetur } from './inbound-retur.entity';

@Entity('inbound_retur_item')
export class InboundReturItem extends BaseEntity {
    @Column({ nullable: true })
    inbound_retur_id: string;

    @ManyToOne(() => InboundRetur, (inboundRetur) => inboundRetur.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inbound_retur_id' })
    inbound_retur: InboundRetur;

    @Column({ nullable: true })
    item_id: string;

    @Column({ nullable: true })
    quantity: number;

    @Column({ nullable: true })
    classification_id: string;

    @Column({ nullable: true })
    uom: string;
}
