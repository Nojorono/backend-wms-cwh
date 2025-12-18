import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./base.entity";
import { AssignedGate } from "./assigned-gate.entity";
import { MasterPallet } from "./master-pallet.entity";
import { MasterItem } from "./master-item.entity";
import { OutboundDo } from "./outbound-do.entity";
import { OutboundMemo } from "./outbound-memo.entity";

export enum AssignedGateLoadStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
}

@Entity('assigned_gate_load')
export class AssignedGateLoad extends BaseEntity {
    @Column({ nullable: true })
    assigned_gate_id: string;

    @ManyToOne(() => AssignedGate, (assignedGate) => assignedGate.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assigned_gate_id' })
    assigned_gate: AssignedGate;

    @Column({ nullable: true })
    outbound_do_id: string;

    @ManyToOne(() => OutboundDo, (outboundDo) => outboundDo.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'outbound_do_id' })
    outbound_do: OutboundDo;

    @Column({ nullable: true })
    outbound_memo_id: string;

    @ManyToOne(() => OutboundMemo, (outboundMemo) => outboundMemo.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'outbound_memo_id' })
    outbound_memo: OutboundMemo;

    @Column({ nullable: true })
    pallet_id: string;

    @ManyToOne(() => MasterPallet, (pallet) => pallet.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pallet_id' })
    pallet: MasterPallet;

    @Column({ nullable: true })
    item_id: string;

    @ManyToOne(() => MasterItem, (item) => item.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'item_id' })
    item: MasterItem;

    @Column({ nullable: true })
    uom: string;

    @Column({ nullable: true })
    quantity_picked: number;

    @Column({ nullable: true })
    quantity_loaded: number;

    @Column({ nullable: true })
    quantity_unloaded: number;

    @Column({ nullable: true, default: AssignedGateLoadStatus.PENDING })
    status: AssignedGateLoadStatus;
}