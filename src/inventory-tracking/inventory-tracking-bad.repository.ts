import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTrackingBad } from '../core/domain/entities/inventory-tracking-bad.entity';
import { CreateInventoryTrackingBadDto } from './dto/create-inventory-bad.dto';

function toDateOrUndefined(value: string | undefined): Date | undefined {
    return value ? new Date(value) : undefined;
}

@Injectable()
export class InventoryTrackingBadRepository {
    constructor(
        @InjectRepository(InventoryTrackingBad)
        private readonly repository: Repository<InventoryTrackingBad>,
    ) { }

    async createOrUpdate(dto: CreateInventoryTrackingBadDto): Promise<InventoryTrackingBad> {
        const qb = this.repository
            .createQueryBuilder('itb')
            .where('itb.inbound_retur_id = :inbound_retur_id', {
                inbound_retur_id: dto.inbound_retur_id,
            })
            .andWhere('itb.inventory_tracking_id = :inventory_tracking_id', {
                inventory_tracking_id: dto.inventory_tracking_id,
            })
            .andWhere('itb.item_id = :item_id', { item_id: dto.item_id });

        if (dto.uom !== undefined && dto.uom !== null) {
            qb.andWhere('itb.uom = :uom', { uom: dto.uom });
        } else {
            qb.andWhere('itb.uom IS NULL');
        }

        const prodDate = toDateOrUndefined(dto.production_date);
        if (prodDate !== undefined) {
            qb.andWhere('itb.production_date = :production_date', {
                production_date: prodDate,
            });
        } else {
            qb.andWhere('itb.production_date IS NULL');
        }

        if (dto.year !== undefined && dto.year !== null) {
            qb.andWhere('itb.year = :year', { year: dto.year });
        } else {
            qb.andWhere('itb.year IS NULL');
        }

        if (dto.hje !== undefined && dto.hje !== null) {
            qb.andWhere('itb.hje = :hje', { hje: dto.hje });
        } else {
            qb.andWhere('itb.hje IS NULL');
        }

        const existing = await qb.getOne();

        if (existing) {
            existing.quantity = dto.quantity;
            existing.uom = dto.uom ?? existing.uom;
            existing.production_date = prodDate ?? existing.production_date;
            existing.year = dto.year ?? existing.year;
            existing.hje = dto.hje ?? existing.hje;
            existing.notes = dto.notes ?? existing.notes;
            return await this.repository.save(existing);
        }

        const createData = {
            ...dto,
            production_date: prodDate,
        };
        const entity = this.repository.create(createData);
        return await this.repository.save(entity);
    }

    async findById(id: string): Promise<InventoryTrackingBad | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ['inboundRetur', 'inventoryTracking', 'item'],
        });
    }

    async findAll(): Promise<InventoryTrackingBad[]> {
        return await this.repository.find({
            relations: ['inboundRetur', 'inventoryTracking', 'item'],
            order: { createdAt: 'DESC' },
        });
    }

    async findByInboundReturId(
        inbound_retur_id: string,
    ): Promise<InventoryTrackingBad[]> {
        return await this.repository.find({
            where: { inbound_retur_id },
            relations: ['inboundRetur', 'inventoryTracking', 'item'],
            order: { createdAt: 'DESC' },
        });
    }
}
