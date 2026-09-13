import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { BtbDetails } from './btb-details.entity';
import { MasterIO } from './master-io.entity';

@Entity('btb')
export class Btb extends BaseEntity {
  @Column({ name: 'btb_number', type: 'varchar', length: 100, nullable: true })
  btb_number: string;

  @Column({ name: 'btb_date', type: 'date', nullable: true })
  btb_date: Date;

  @Column({ name: 'organization_code', type: 'varchar', length: 100, nullable: true })
  organization_code: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organization_id: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ name: 'sales_nik', type: 'varchar', length: 50, nullable: true })
  sales_nik: string;

  @Column({ name: 'sales_name', type: 'varchar', length: 255, nullable: true })
  sales_name: string;

  @Column({ name: 'sales_spv_nik', type: 'varchar', length: 50, nullable: true })
  sales_spv_nik: string;

  @Column({ name: 'sales_spv_name', type: 'varchar', length: 255, nullable: true })
  sales_spv_name: string;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: true })
  status: string;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  created_by: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 100, nullable: true })
  updated_by: string;

  @OneToMany(() => BtbDetails, (detail) => detail.btb)
  details: BtbDetails[];
}
