import { Entity, Column, OneToMany } from 'typeorm';
import { InboundDo } from './inbound-do.entity';
import { BaseEntity } from './base.entity';

@Entity('inbound')
export class Inbound extends BaseEntity {
  @Column({ nullable: true })
  inbound_number: string;

  @Column({ nullable: true })
  expedition: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  license_plate: string;

  @Column({ nullable: true })
  driver_name: string;

  @Column({ nullable: true })
  driver_phone: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  inbound_type: string;

  @Column({ nullable: true })
  arrival_date: Date;

  @OneToMany(() => InboundDo, (inboundDo) => inboundDo.inbound)
  inbound_dos: InboundDo[];
}
