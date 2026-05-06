import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemo } from './outbound-memo.entity';
@Entity('outbound_integration_ir_req')
export class OutboundIntegrationIrReq extends BaseEntity {
    @Column({ nullable: true })
    organization_id: string;

    @Column({ nullable: true })
    outbound_memo_id: string;

    @ManyToOne(() => OutboundMemo, { onDelete: 'RESTRICT', nullable: true })
    @JoinColumn({ name: 'outbound_memo_id' })
    outbound_memo: OutboundMemo;

    @Column({ name: 'iface_header_id', type: 'bigint', nullable: true })
    iface_header_id: number;

    @Column({ name: 'transaction_type', type: 'varchar', length: 200, nullable: true })
    transaction_type: string;

    @Column({ name: 'source_code', type: 'varchar', length: 30, nullable: true })
    source_code: string;

    @Column({ name: 'source_header_id', type: 'varchar', length: 100, nullable: true })
    source_header_id: string;

    @Column({ name: 'need_by_date', type: 'timestamp', nullable: true })
    need_by_date: Date;

    @Column({ name: 'preparer_number', type: 'varchar', length: 30, nullable: true })
    preparer_number: string;

    @Column({ name: 'preparer_id', type: 'varchar', length: 30, nullable: true })
    preparer_id: string;

    @Column({ name: 'requestor_number', type: 'varchar', length: 30, nullable: true })
    requestor_number: string;

    @Column({ name: 'requestor_id', type: 'varchar', length: 30, nullable: true })
    requestor_id: string;

    @Column({ name: 'org_name', type: 'varchar', length: 50, nullable: true })
    org_name: string;

    @Column({ name: 'org_id', type: 'bigint', nullable: true })
    org_id: number;

    @Column({ name: 'io_source_name', type: 'varchar', length: 50, nullable: true })
    io_source_name: string;

    @Column({ name: 'io_source_id', type: 'bigint', nullable: true })
    io_source_id: number;

    @Column({ name: 'io_dest_name', type: 'varchar', length: 50, nullable: true })
    io_dest_name: string;

    @Column({ name: 'io_dest_id', type: 'bigint', nullable: true })
    io_dest_id: number;

    @Column({ name: 'header_attribute_category', type: 'varchar', length: 30, nullable: true })
    header_attribute_category: string;

    @Column({ name: 'header_attribute7', type: 'varchar', length: 150, nullable: true })
    header_attribute7: string;

    @Column({ name: 'ir_header_id', type: 'bigint', nullable: true })
    ir_header_id: number;

    @Column({ name: 'ir_number', type: 'bigint', nullable: true })
    ir_number: number;

    @Column({ name: 'so_header_id', type: 'bigint', nullable: true })
    so_header_id: number;

    @Column({ name: 'so_number', type: 'bigint', nullable: true })
    so_number: number;

    @Column({ name: 'total_lines', type: 'bigint', nullable: true })
    total_lines: number;

    @Column({ name: 'batch_number', type: 'varchar', length: 100, nullable: true })
    batch_number: string;

    @Column({ name: 'iface_status_ir', type: 'varchar', length: 100, nullable: true })
    iface_status_ir: string;

    @Column({ name: 'iface_message_ir', type: 'varchar', length: 4000, nullable: true })
    iface_message_ir: string;

    @Column({ name: 'iface_status_io', type: 'varchar', length: 100, nullable: true })
    iface_status_io: string;

    @Column({ name: 'iface_message_io', type: 'varchar', length: 4000, nullable: true })
    iface_message_io: string;

    @Column({ name: 'iface_status_oi', type: 'varchar', length: 100, nullable: true })
    iface_status_oi: string;

    @Column({ name: 'iface_message_oi', type: 'varchar', length: 4000, nullable: true })
    iface_message_oi: string;

    @Column({ name: 'request_id_ir', type: 'bigint', nullable: true })
    request_id_ir: number;

    @Column({ name: 'request_id_io', type: 'bigint', nullable: true })
    request_id_io: number;

    @Column({ name: 'request_id_oi', type: 'bigint', nullable: true })
    request_id_oi: number;

    @Column({ name: 'creation_date', type: 'timestamp', nullable: true })
    creation_date: Date;

    @Column({ name: 'last_updated_date', type: 'timestamp', nullable: true })
    last_updated_date: Date;

    @Column({ name: 'created_by', type: 'bigint', nullable: true })
    created_by: number;

    @Column({ name: 'last_updated_by', type: 'bigint', nullable: true })
    last_updated_by: number;
}
