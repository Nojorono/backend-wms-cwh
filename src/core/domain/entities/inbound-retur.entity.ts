import { Column, Entity, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { InboundReturHelper } from "./inbound-retur-helper.entity";
import { InboundReturItem } from "./inbound-retur-item.entity";
import { InboundReturSorting } from "./inbound-retur-sorting.entity";

export enum InboundReturStatus {
    CREATED = 'CREATED',
    ASSIGNED_HELPER = 'ASSIGNED_HELPER',
    SORTING = 'SORTING',
    INSPECTION = 'INSPECTION',
    COMPLETED = 'COMPLETED',
}

@Entity('inbound_retur')
export class InboundRetur extends BaseEntity {
    @Column({ nullable: true })
    inbound_retur_id_reference: string;

    @Column({ nullable: true })
    inbound_retur_number: string; // INR-YYYY-NNNN

    @Column({ nullable: true })
    meta_number: string; // INR-META-YYYY-NNNN

    @Column({ nullable: true })
    expedition: string;

    @Column({ nullable: true })
    origin: string;

    @Column({ nullable: true })
    license_plate: string;

    @Column({ nullable: true })
    driver_name: string;

    @Column({ nullable: true })
    driver_phone: string;

    @Column({ nullable: true })
    status: InboundReturStatus;

    @Column({ nullable: true })
    inbound_retur_type: string;

    @Column({ nullable: true })
    arrival_date: Date;

    @Column({ nullable: true })
    notes: string;

    @OneToMany(() => InboundReturHelper, (inboundReturHelper) => inboundReturHelper.inbound_retur)
    inbound_retur_helpers: InboundReturHelper[];

    @OneToMany(() => InboundReturItem, (inboundReturItem) => inboundReturItem.inbound_retur)
    inbound_retur_items: InboundReturItem[];

    @OneToMany(() => InboundReturSorting, (sorting) => sorting.inbound_retur)
    inbound_retur_sortings: InboundReturSorting[];
}
