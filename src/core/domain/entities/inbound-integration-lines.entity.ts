import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { InboundIntegration } from './inbound-integration.entity';

@Entity('inbound_integration_lines')
export class InboundIntegrationLines extends BaseEntity {
    @Column({ nullable: true })
    inbound_integration_id: string;

    @ManyToOne(() => InboundIntegration, (inboundIntegration) => inboundIntegration.id, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'inbound_integration_id' })
    inbound_integration: InboundIntegration;

    @Column({ name: 'iface_line_id', type: 'bigint', nullable: true })
    iface_line_id: number;

    @Column({ name: 'iface_header_id', type: 'bigint', nullable: true })
    iface_header_id: number;

    @Column({ name: 'source_line_id', type: 'varchar', length: 100, nullable: true })
    source_line_id: string;

    @Column({ name: 'source_header_id', type: 'varchar', length: 100, nullable: true })
    source_header_id: string;

    @Column({ name: 'po_number', type: 'varchar', length: 20, nullable: true })
    po_number: string;

    @Column({ name: 'po_line_number', type: 'bigint', nullable: true })
    po_line_number: number;

    @Column({ name: 'iso_number', type: 'varchar', length: 30, nullable: true })
    iso_number: string;

    @Column({ name: 'iso_line_number', type: 'bigint', nullable: true })
    iso_line_number: number;

    @Column({ name: 'inventory_item_id', type: 'bigint', nullable: true })
    inventory_item_id: number;

    @Column({ name: 'uom_code', type: 'varchar', length: 25, nullable: true })
    uom_code: string;

    @Column({ name: 'quantity', type: 'bigint', nullable: true })
    quantity: number;

    @Column({ name: 'subinventory', type: 'varchar', length: 10, nullable: true })
    subinventory: string;

    @Column({ name: 'locator_id', type: 'bigint', nullable: true })
    locator_id: number;

    @Column({ name: 'quantity_selisih', type: 'bigint', nullable: true })
    quantity_selisih: number;

    @Column({ name: 'subinventory_selisih', type: 'varchar', length: 10, nullable: true })
    subinventory_selisih: string;

    @Column({ name: 'locator_id_selisih', type: 'bigint', nullable: true })
    locator_id_selisih: number;

    @Column({ name: 'status_selisih', type: 'varchar', length: 30, nullable: true })
    status_selisih: string;

    @Column({ name: 'message_selisih', type: 'varchar', length: 240, nullable: true })
    message_selisih: string;

    @Column({ name: 'shipment_line_id', type: 'bigint', nullable: true })
    shipment_line_id: number;

    @Column({ name: 'interface_transaction_id', type: 'bigint', nullable: true })
    interface_transaction_id: number;

    @Column({ name: 'status', type: 'varchar', length: 30, nullable: true })
    status: string;

    @Column({ name: 'message', type: 'varchar', length: 240, nullable: true })
    message: string;

    @Column({ name: 'created_by', type: 'bigint', nullable: true })
    created_by: number;

    @Column({ name: 'creation_date', type: 'timestamp', nullable: true })
    creation_date: Date;

    @Column({ name: 'last_updated_by', type: 'bigint', nullable: true })
    last_updated_by: number;

    @Column({ name: 'last_updated_date', type: 'timestamp', nullable: true })
    last_updated_date: Date;
}
