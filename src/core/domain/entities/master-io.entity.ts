import { BaseEntity } from './base.entity';
import { Column, Entity } from 'typeorm';

@Entity('m_io')
export class MasterIO extends BaseEntity {
  @Column({ name: 'organization_code', nullable: true })
  organization_code: string;

  @Column({ name: 'organization_id', type: 'bigint', nullable: true })
  organization_id: number;

  @Column({ name: 'organization_name', nullable: true })
  organization_name: string;

  @Column({ name: 'org_name', nullable: true })
  org_name: string;

  @Column({ name: 'org_id', nullable: true })
  org_id: string;

  @Column({ name: 'organization_type', nullable: true })
  organization_type: string;

  @Column({ name: 'region_code', nullable: true })
  region_code: string;

  @Column({ name: 'address', nullable: true })
  address: string;

  @Column({ name: 'location_id', type: 'bigint', nullable: true })
  location_id: number;

  @Column({ name: 'start_date_active', type: 'timestamp', nullable: true })
  start_date_active: Date;

  @Column({ name: 'end_date_active', type: 'timestamp', nullable: true })
  end_date_active: Date;
}
