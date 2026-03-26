import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Inbound } from './inbound.entity';
import { User } from './user.entity';

@Entity('assigned_helper')
export class AssignedHelper extends BaseEntity {
  @Column({ nullable: true })
  inbound_id: string;

  @ManyToOne(() => Inbound, (inbound) => inbound.assigned_helpers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inbound_id' })
  inbound: Inbound;

  @Column({ nullable: true })
  helper_user_id: string;

  @Column({ nullable: true })
  helper_name: string;

  @Column({ nullable: true })
  helper_phone: string;

  // Populated via query builder left join on helper_user_id
  user?: User;
}
