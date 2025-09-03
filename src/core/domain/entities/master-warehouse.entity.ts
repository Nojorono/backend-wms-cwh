import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('m_warehouse')
export class MasterWarehouse extends BaseEntity {

  @Column({ nullable: true })
  organization_id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

} 