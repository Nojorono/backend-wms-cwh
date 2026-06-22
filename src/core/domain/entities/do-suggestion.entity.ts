import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DoSuggestionDetail } from './do-suggestion-detail.entity';
import { MasterIO } from './master-io.entity';

export enum DoSuggestionStatus {
    DRAFT = 'DRAFT',
    REVISED = 'REVISED',
    SUBMITTED = 'SUBMITTED',
    FINAL = 'FINAL',
}

@Entity('do_suggestion')
export class DoSuggestion extends BaseEntity {
    @Column({ name: 'organization_id', type: 'uuid', nullable: true })
    organization_id: string;

    @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: MasterIO;

    @Column({ name: 'callplan_number', type: 'varchar', length: 100, nullable: true })
    callplan_number: string;

    @Column({ name: 'callplan_date_start', type: 'date', nullable: true })
    callplan_date_start: Date;

    @Column({ name: 'callplan_date_end', type: 'date', nullable: true })
    callplan_date_end: Date;

    @Column({ name: 'route_number', type: 'varchar', length: 100, nullable: true })
    route_number: string;

    @Column({ name: 'trip_type', type: 'varchar', length: 50, nullable: true })
    trip_type: string;

    @Column({ name: 'sales_nik', type: 'varchar', length: 50, nullable: true })
    sales_nik: string;

    @Column({ name: 'sales_name', type: 'varchar', length: 255, nullable: true })
    sales_name: string;

    @Column({ name: 'sales_spv', type: 'varchar', length: 255, nullable: true })
    sales_spv: string;

    @Column({ name: 'sales_spv_nik', type: 'varchar', length: 50, nullable: true })
    sales_spv_nik: string;

    @Column({
        name: 'status',
        type: 'enum',
        enum: DoSuggestionStatus,
        default: DoSuggestionStatus.DRAFT,
        nullable: true,
    })
    status: DoSuggestionStatus;

    @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
    created_by: string;

    @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
    updated_by: string;
    @Column({ name: 'spb_date', type: 'date', nullable: true })
    spb_date: Date;

    @Column({ name: 'spb_number', type: 'varchar', length: 100, nullable: true })
    spb_number: string;

    @OneToMany(() => DoSuggestionDetail, (detail) => detail.do_suggestion)
    details: DoSuggestionDetail[];
}
