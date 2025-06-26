import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('m_vehicle')
export class MasterVehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vehicle_type: string;

  @Column({ nullable: true })
  vehicle_brand: string;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
} 