import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('m_uom')
export class MasterUom extends BaseEntity {
  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
