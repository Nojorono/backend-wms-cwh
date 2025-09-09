import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Role } from './role.entity';
import { BaseEntity } from './base.entity';

@Entity('users')
@Index(['username'], { unique: true })
@Index(['roleId'])
export class User extends BaseEntity {
  @Column({ unique: true, length: 100 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Role, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({ name: 'user_detail_id', nullable: true })
  userDetailId: string;
}
