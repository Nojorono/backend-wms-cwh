
import { BaseEntity } from './base.entity';
import { Column, Entity } from 'typeorm';

@Entity('m_io')
export class MasterIO extends BaseEntity {

  @Column({ nullable: true })
  organization_id: number;

  @Column({ nullable: true })
  organization_name: string;

  @Column({ nullable: true })
  operating_unit: string;

  @Column({ nullable: true })
  address: string;
} 