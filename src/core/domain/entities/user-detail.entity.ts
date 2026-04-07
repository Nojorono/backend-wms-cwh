import { Entity, Column, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MasterIO } from './master-io.entity';
import { User } from './user.entity';

@Entity('user_details')
@Index(['userId'], { unique: true })
export class UserDetail extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (user) => user.userDetail)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column({ nullable: true })
  employee_id: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: MasterIO;

  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;
}
