import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('m_classification_item')
export class MasterClassificationItem extends BaseEntity {

  @Column({ nullable: true })
  classification_name: string;

  @Column({ nullable: true })
  classification_code: string;

  @Column({ nullable: true })
  classification_description: string;
} 