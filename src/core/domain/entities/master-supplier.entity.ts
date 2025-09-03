import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('m_supplier')
export class MasterSupplier extends BaseEntity {

  @Column({ nullable: true })
  organization_id: number;

  @Column({ nullable: true })
  operating_unit: string;

  @Column({ nullable: true })
  supplier_code: string;

  @Column({ nullable: true })
  supplier_name: string;

  @Column({ nullable: true })
  supplier_address: string;

  @Column({ nullable: true })
  supplier_contact_person: string;

  @Column({ nullable: true })
  supplier_phone: string;

  @Column({ nullable: true })
  supplier_email: string;
}