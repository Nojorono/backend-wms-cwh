import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterIO } from './master-io.entity';

@Entity('management_user_fas')
export class ManagementUserFas extends BaseEntity {
    @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: MasterIO;

    @Column({ name: 'organization_id', nullable: true })
    organizationId: string;

    @Column({ name: 'name', length: 255 })
    name: string;

    @Column({ name: 'email', length: 255 })
    email: string;
}
