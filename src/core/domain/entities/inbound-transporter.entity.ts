import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { MasterVehicle } from './master-vehicle.entity';    

@Entity('inbound_transporter')
export class InboundTransporter {
  @PrimaryGeneratedColumn('uuid')   
  id: string;

  @Column({ name: 'inbound_plan_id' })
  inbound_plan_id: string;

  @Column({ name: 'organization_id' })
  organization_id: number;

  @ManyToOne(() => MasterVehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: MasterVehicle;

  @Column({ name: 'transporter_code_number', nullable: true })
  transporter_code_number: string;

  @Column({ name: 'transporter_name', nullable: true })
  transporter_name: string;

  @Column({ name: 'transporter_phone', nullable: true })
  transporter_phone: string;

  @Column({ name: 'transporter_email', nullable: true })
  transporter_email: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'created_by', nullable: true })
  created_by: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ name: 'updated_by', nullable: true })
  updated_by: string;
} 