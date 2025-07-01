import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('inbound_attachment')
export class InboundAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inbound_plan_id', nullable: true })
  inbound_plan_id: string;

  @Column({ name: 'organization_id', nullable: true })
  organization_id: number;

  @Column({ name: 'name', nullable: true })
  name: string;

  @Column({ name: 'path', nullable: true })
  path: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 