import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('m_week')
export class MasterWeek extends BaseEntity {
  @Column({ nullable: true })
  BULAN: number;

  @Column({ nullable: true })
  MINGGU: number;

  @Column({ nullable: true })
  QUARTER: number;

  @Column({ nullable: true })
  TAHUN: number;

  @Column({ name: 'TANGGAL_AKHIR_MINGGU', nullable: true })
  TANGGAL_AKHIR_MINGGU: Date;

  @Column({ name: 'TANGGAL_AKHIR_MINGGU_REAL', nullable: true })
  TANGGAL_AKHIR_MINGGU_REAL: Date;

  @Column({ name: 'TANGGAL_AWAL_MINGGU', nullable: true })
  TANGGAL_AWAL_MINGGU: Date;

  @Column({ name: 'TANGGAL_AWAL_MINGGU_REAL', nullable: true })
  TANGGAL_AWAL_MINGGU_REAL: Date;
}
