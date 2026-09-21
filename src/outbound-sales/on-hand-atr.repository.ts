import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnHandAtr } from '../core/domain/entities/on-hand-atr.entity';
import { INDONESIA_TIMEZONE } from '../core/utils/date-transformer.util';
import { CreateOnHandAtrDto } from './dto/create-on-hand-atr.dto';
import { UpdateOnHandAtrDto } from './dto/update-on-hand-atr.dto';
import { DistinctLocatorByOrganizationDto } from './dto/distinct-locator-by-organization.dto';
const ON_HAND_ATR_RELATIONS = ['organization'] as const;

@Injectable()
export class OnHandAtrRepository {
    constructor(
        @InjectRepository(OnHandAtr)
        private readonly repo: Repository<OnHandAtr>,
    ) { }

    async create(dto: CreateOnHandAtrDto): Promise<OnHandAtr> {
        const entity = this.repo.create(dto);
        return await this.repo.save(entity);
    }

    async createMany(dtos: CreateOnHandAtrDto[]): Promise<OnHandAtr[]> {
        if (!dtos.length) {
            return [];
        }

        const entities = this.repo.create(dtos);
        return await this.repo.save(entities);
    }

    async findAll(): Promise<OnHandAtr[]> {
        return await this.repo.find({
            relations: [...ON_HAND_ATR_RELATIONS],
            order: { createdAt: 'DESC' },
        });
    }

    async findById(id: string): Promise<OnHandAtr | null> {
        return await this.repo.findOne({
            where: { id },
            relations: [...ON_HAND_ATR_RELATIONS],
        });
    }

    async findByOrganizationId(organizationId: string): Promise<OnHandAtr[]> {
        return await this.repo.find({
            where: { organization_id: organizationId },
            relations: [...ON_HAND_ATR_RELATIONS],
            order: { createdAt: 'DESC' },
        });
    }

    async update(id: string, dto: UpdateOnHandAtrDto): Promise<OnHandAtr> {
        const existing = await this.findById(id);
        if (!existing) {
            throw new NotFoundException(`On-hand ATR record with id ${id} not found`);
        }

        await this.repo.update(id, dto);
        return (await this.findById(id)) as OnHandAtr;
    }

    async remove(id: string): Promise<void> {
        const existing = await this.findById(id);
        if (!existing) {
            throw new NotFoundException(`On-hand ATR record with id ${id} not found`);
        }

        await this.repo.softDelete(id);
    }

    // Latest distinct LHS snapshot dates (WIB) — same filters as findByOrganizationIdAndDate.
    async findByOrganizationIdDistinctCreatedAtDate(
        organizationId: string,
        limit = 2,
        organizationCode?: string,
        subinventoryCodes?: string[],
        status: string | null | undefined = 'LHS',
    ): Promise<Array<{ date: string }>> {
        const qb = this.repo
            .createQueryBuilder('onHandAtr')
            // TO_CHAR → string so node-pg never Date-parses and shifts the calendar day.
            .select(
                `TO_CHAR(DATE(onHandAtr.created_at AT TIME ZONE '${INDONESIA_TIMEZONE}'), 'YYYY-MM-DD')`,
                'snapshot_date',
            )
            .where('onHandAtr.organization_id = :organizationId', { organizationId })
            .andWhere('onHandAtr.deleted_at IS NULL');

        if (organizationCode?.trim()) {
            qb.andWhere('onHandAtr.organization_code = :organizationCode', {
                organizationCode: organizationCode.trim(),
            });
        }

        if (subinventoryCodes?.length) {
            qb.andWhere('onHandAtr.subinventory_code IN (:...subinventoryCodes)', {
                subinventoryCodes,
            });
        }

        if (status === null) {
            qb.andWhere('(onHandAtr.status IS NULL OR TRIM(onHandAtr.status) = \'\')');
        } else if (typeof status === 'string' && status.trim() !== '') {
            qb.andWhere('UPPER(TRIM(onHandAtr.status)) = :status', {
                status: status.trim().toUpperCase(),
            });
        }

        const rows = await qb
            .distinct(true)
            .orderBy('snapshot_date', 'DESC')
            .limit(limit)
            .getRawMany<{ snapshot_date: string | Date }>();

        return rows.map((row) => ({
            date: this.formatSnapshotDate(row.snapshot_date),
        }));
    }

    /**
     * Normalize snapshot date to YYYY-MM-DD in WIB.
     * Never use getUTC* / toISOString on PG dates — local midnight (+07)
     * becomes the previous UTC calendar day (e.g. 21 → 20).
     */
    private formatSnapshotDate(value: string | Date): string {
        if (typeof value === 'string') {
            const matched = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
            if (matched) {
                return matched[1];
            }
        }

        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: INDONESIA_TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(value);
        }

        return String(value).slice(0, 10);
    }

    async findByOrganizationIdAndDate(
        organizationId: string,
        date: string,
        organizationCode?: string,
        subinventoryCodes?: string[],
        /**
         * - `undefined`: no status filter (used by LHS upgrade to load any same-day rows)
         * - `null`: only rows with status IS NULL (regular on-hand snapshot)
         * - string: exact status match (e.g. 'LHS')
         */
        status?: string | null,
    ): Promise<OnHandAtr[]> {
        const normalizedDate = date.trim().split('T')[0];
        const qb = this.repo
            .createQueryBuilder('onHandAtr')
            .leftJoinAndSelect('onHandAtr.organization', 'organization')
            .where('onHandAtr.organization_id = :organizationId', { organizationId })
            .andWhere(
                `DATE(onHandAtr.created_at AT TIME ZONE '${INDONESIA_TIMEZONE}') = :savedDate`,
                { savedDate: normalizedDate },
            )
            .andWhere('onHandAtr.deleted_at IS NULL');

        if (organizationCode?.trim()) {
            qb.andWhere('onHandAtr.organization_code = :organizationCode', {
                organizationCode: organizationCode.trim(),
            });
        }

        if (subinventoryCodes?.length) {
            qb.andWhere('onHandAtr.subinventory_code IN (:...subinventoryCodes)', {
                subinventoryCodes,
            });
        }

        if (status === null) {
            qb.andWhere('(onHandAtr.status IS NULL OR TRIM(onHandAtr.status) = \'\')');
        } else if (typeof status === 'string' && status.trim() !== '') {
            qb.andWhere('UPPER(TRIM(onHandAtr.status)) = :status', {
                status: status.trim().toUpperCase(),
            });
        }

        return await qb.orderBy('onHandAtr.created_at', 'DESC').getMany();
    }

    async findByOrganizationIdAndItemCodeAndDate(organizationId: string, itemCode: string, date: string): Promise<OnHandAtr[]> {
        const normalizedDate = date.trim().split('T')[0];
        return await this.repo
            .createQueryBuilder('onHandAtr')
            .leftJoinAndSelect('onHandAtr.organization', 'organization')
            .where('onHandAtr.organization_id = :organizationId', { organizationId })
            .andWhere('onHandAtr.item_code = :itemCode', { itemCode })
            .andWhere(
                `DATE(onHandAtr.created_at AT TIME ZONE '${INDONESIA_TIMEZONE}') = :savedDate`,
                { savedDate: normalizedDate },
            )
            .andWhere('onHandAtr.deleted_at IS NULL')
            .orderBy('onHandAtr.created_at', 'DESC')
            .getMany();
    }

    async findDistinctLocatorsByOrganizationId(
        organizationId: string,
    ): Promise<DistinctLocatorByOrganizationDto[]> {
        const rows = await this.repo
            .createQueryBuilder('onHandAtr')
            .select('onHandAtr.organization_code', 'organization_code')
            .addSelect('onHandAtr.organization_name', 'organization_name')
            .addSelect('onHandAtr.subinventory_code', 'subinventory_code')
            .addSelect('onHandAtr.locator_id', 'locator_id')
            .addSelect('onHandAtr.locator', 'locator')
            .addSelect('onHandAtr.locator_name', 'locator_name')
            .where('onHandAtr.organization_id = :organizationId', { organizationId })
            .andWhere('onHandAtr.deleted_at IS NULL')
            .distinct(true)
            .orderBy('onHandAtr.organization_code', 'ASC')
            .addOrderBy('onHandAtr.subinventory_code', 'ASC')
            .addOrderBy('onHandAtr.locator_name', 'ASC')
            .getRawMany<{
                organization_code: string | null;
                organization_name: string | null;
                subinventory_code: string | null;
                locator_id: number | string | null;
                locator: string | null;
                locator_name: string | null;
            }>();

        return rows.map((row) => ({
            organization_code: row.organization_code ?? undefined,
            organization_name: row.organization_name ?? undefined,
            subinventory_code: row.subinventory_code ?? undefined,
            locator_id:
                row.locator_id == null ? undefined : Number(row.locator_id),
            locator: row.locator ?? undefined,
            locator_name: row.locator_name ?? undefined,
        }));
    }
}
