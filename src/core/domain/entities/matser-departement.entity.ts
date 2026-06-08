import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('m_departement')
export class MasterDepartement extends BaseEntity {
    @Column({ nullable: true })
    departement_code: string;

    @Column({ nullable: true })
    departement_name: string;

    @Column({ nullable: true })
    is_active: boolean;
}
