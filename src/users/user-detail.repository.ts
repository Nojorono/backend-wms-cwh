import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDetail } from '../core/domain/entities/user-detail.entity';

@Injectable()
export class UserDetailRepository {
  constructor(
    @InjectRepository(UserDetail)
    private readonly repository: Repository<UserDetail>,
  ) {}

  /**
   * Resolve email addresses by NIK.
   * NIK from Snowflake (AHOM_NIK / SALES_SUPERVISOR_NIK) maps to user_details.employee_id.
   */
  async findEmailMapByNik(niks: string[]): Promise<Map<string, string>> {
    const normalizedNiks = [
      ...new Set(niks.map((nik) => this.normalizeNik(nik)).filter((nik): nik is string => Boolean(nik))),
    ];

    if (!normalizedNiks.length) {
      return new Map();
    }

    const rows = await this.repository
      .createQueryBuilder('ud')
      .select(['ud.employee_id', 'ud.email'])
      .where('UPPER(TRIM(ud.employee_id)) IN (:...niks)', { niks: normalizedNiks })
      .andWhere('ud.email IS NOT NULL')
      .andWhere("TRIM(ud.email) <> ''")
      .getMany();

    const emailMap = new Map<string, string>();

    for (const row of rows) {
      const nik = this.normalizeNik(row.employee_id);
      const email = row.email?.trim();
      if (nik && email && !emailMap.has(nik)) {
        emailMap.set(nik, email);
      }
    }

    return emailMap;
  }

  private normalizeNik(value: string | null | undefined): string | null {
    if (value == null) {
      return null;
    }

    const normalized = value.trim().toUpperCase();
    return normalized || null;
  }
}
