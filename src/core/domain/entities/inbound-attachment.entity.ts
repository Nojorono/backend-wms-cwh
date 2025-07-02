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

  @Column({ name: 's3_bucket', nullable: true })
  s3_bucket: string;

  @Column({ name: 's3_key', nullable: true })
  s3_key: string;

  @Column({ name: 's3_url', nullable: true })
  s3_url: string;

  @Column({ name: 'file_size', nullable: true })
  file_size: number;

  @Column({ name: 'content_type', nullable: true })
  content_type: string;

  @Column({ name: 'etag', nullable: true })
  etag: string;

  @Column({ name: 'is_public', default: false })
  is_public: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 