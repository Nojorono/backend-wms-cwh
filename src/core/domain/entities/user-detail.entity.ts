import { 
    Entity, 
    Column, 
    Index,
    JoinColumn,
    ManyToOne
  } from 'typeorm';
  import { BaseEntity } from './base.entity';
import { MasterIO } from './master-io.entity';
  
  @Entity('user_details')
  @Index(['userId'], { unique: true })
  export class UserDetail extends BaseEntity {
  
    @Column({ name: 'user_id', length: 100 })
    userId: string;
  
    @Column({ length: 255 })
    employee_id: string;
  
    @Column({ length: 255 })
    email: string;

    @Column({ length: 255 })
    phone: string;

    @ManyToOne(() => MasterIO, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'organization_id' })
    organization: MasterIO;

    @Column({ name: 'organization_id' })
    organizationId: string;
  }