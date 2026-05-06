import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OutboundMemoItem } from './outbound-memo-item.entity';
@Entity('outbound_integration_ir_req_lines')
export class OutboundIntegrationIrReqLines extends BaseEntity {
    @Column({ nullable: true })
    outbound_memo_item_id: string;

    @ManyToOne(() => OutboundMemoItem, { onDelete: 'RESTRICT', nullable: true })
    @JoinColumn({ name: 'outbound_memo_item_id' })
    outbound_memo_item: OutboundMemoItem;

    @Column({ name: 'iface_header_id', type: 'bigint', nullable: true })
    iface_header_id: number;

    @Column({ name: 'iface_line_id', type: 'bigint', nullable: true })
    iface_line_id: number;

    @Column({ name: 'source_header_id', type: 'varchar', length: 100, nullable: true })
    source_header_id: string;

    @Column({ name: 'source_line_id', type: 'varchar', length: 100, nullable: true })
    source_line_id: string;

    @Column({ name: 'inventory_item_id', type: 'bigint', nullable: true })
    inventory_item_id: number;

    @Column({ name: 'item', type: 'varchar', length: 40, nullable: true })
    item: string;

    @Column({ name: 'quantity', type: 'bigint', nullable: true })
    quantity: number;

    @Column({ name: 'transaction_uom', type: 'varchar', length: 5, nullable: true })
    transaction_uom: string;

    @Column({ name: 'ir_line_id', type: 'bigint', nullable: true })
    ir_line_id: number;

    @Column({ name: 'ir_line_number', type: 'bigint', nullable: true })
    ir_line_number: number;

    @Column({ name: 'so_line_id', type: 'bigint', nullable: true })
    so_line_id: number;

    @Column({ name: 'so_line_number', type: 'bigint', nullable: true })
    so_line_number: number;

    @Column({ name: 'iface_line_status_ir', type: 'varchar', length: 100, nullable: true })
    iface_line_status_ir: string;

    @Column({ name: 'iface_line_message_ir', type: 'varchar', length: 4000, nullable: true })
    iface_line_message_ir: string;

    @Column({ name: 'creation_date', type: 'timestamp', nullable: true })
    creation_date: Date;

    @Column({ name: 'last_updated_date', type: 'timestamp', nullable: true })
    last_updated_date: Date;

    @Column({ name: 'created_by', type: 'bigint', nullable: true })
    created_by: number;

    @Column({ name: 'last_updated_by', type: 'bigint', nullable: true })
    last_updated_by: number;
}
