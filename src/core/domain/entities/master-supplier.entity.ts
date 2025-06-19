import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('m_supplier')
export class MasterSupplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}