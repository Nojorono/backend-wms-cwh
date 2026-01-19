import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('user_manage')
export class UserManage extends BaseEntity {
  @Column({ name: 'name', length: 255 })
  name: string;
  
  @Column({ name: 'phone', length: 255 })
  phone: string;

  @Column({ name: 'role_name', length: 255 })
  roleName: string;
}
