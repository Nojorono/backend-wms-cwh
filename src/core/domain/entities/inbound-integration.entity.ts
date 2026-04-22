import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Inbound } from './inbound.entity';
import { InboundDo } from './inbound-do.entity';
import { MasterIO } from './master-io.entity';

export enum RcvReceiptTransactionType {
    INBOUND_GS_MUTASI_SO_INTERNAL = 'Inbound GS Mutasi SO Internal',
    INBOUND_GS_PRINCIPAL = 'Inbound GS Principal',
    ADD_TO_RECEIPT = 'Add to Receipt',
}

@Index('UQ_inbound_integration_inbound_do_id', ['inbound_do_id'], { unique: true })
@Entity('inbound_integration')
export class InboundIntegration extends BaseEntity {
    @Column({ nullable: true })
    organization_id: string;

    @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: MasterIO;

    @Column({ nullable: true })
    inbound_id: string;

    @ManyToOne(() => Inbound, (inbound) => inbound.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inbound_id' })
    inbound: Inbound;

    @Column({ nullable: true })
    inbound_do_id: string;

    @ManyToOne(() => InboundDo, (inboundDo) => inboundDo.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inbound_do_id' })
    inbound_do: InboundDo;

    @Column({ name: 'iface_header_id', type: 'bigint', nullable: true })
    iface_header_id: number;

    @Column({
        name: 'transaction_type',
        type: 'enum',
        enum: RcvReceiptTransactionType,
        nullable: true,
    })
    transaction_type: RcvReceiptTransactionType;

    @Column({ name: 'source_system', type: 'varchar', length: 100, nullable: true })
    source_system: string;

    @Column({ name: 'receipt_source_code', type: 'varchar', length: 30, nullable: true })
    receipt_source_code: string;

    @Column({ name: 'source_header_id', type: 'varchar', length: 100, nullable: true })
    source_header_id: string;

    @Column({ name: 'do_number', type: 'varchar', length: 30, nullable: true })
    do_number: string;

    @Column({ name: 'vendor_id', type: 'bigint', nullable: true })
    vendor_id: number;

    @Column({ name: 'vendor_site_id', type: 'bigint', nullable: true })
    vendor_site_id: number;

    @Column({ name: 'shipment_header_id', type: 'bigint', nullable: true })
    shipment_header_id: number;

    @Column({ name: 'org_id', type: 'bigint', nullable: true })
    org_id: number;

    @Column({ name: 'rsh_attribute1', type: 'varchar', length: 150, nullable: true })
    rsh_attribute1: string;

    @Column({ name: 'rsh_attribute2', type: 'varchar', length: 150, nullable: true })
    rsh_attribute2: string;

    @Column({ name: 'rsh_attribute3', type: 'varchar', length: 150, nullable: true })
    rsh_attribute3: string;

    @Column({ name: 'receipt_number', type: 'varchar', length: 30, nullable: true })
    receipt_number: string;

    @Column({ name: 'group_id', type: 'bigint', nullable: true })
    group_id: number;

    @Column({ name: 'total_lines', type: 'bigint', nullable: true })
    total_lines: number;

    @Column({ name: 'header_interface_id', type: 'bigint', nullable: true })
    header_interface_id: number;

    @Column({ name: 'request_id', type: 'bigint', nullable: true })
    request_id: number;

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
