import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';import { OnHandAtr } from '../core/domain/entities/on-hand-atr.entity';
import { CreateOnHandAtrDto } from './dto/create-on-hand-atr.dto';
import { UpdateOnHandAtrDto } from './dto/update-on-hand-atr.dto';

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

    async findByOrganizationIdAndDate(organizationId: string, date: string): Promise<OnHandAtr[]> {
        return await this.repo
            .createQueryBuilder('onHandAtr')
            .leftJoinAndSelect('onHandAtr.organization', 'organization')
            .where('onHandAtr.organization_id = :organizationId', { organizationId })
            .andWhere('DATE(onHandAtr.created_at) = :date', { date })
            .orderBy('onHandAtr.created_at', 'DESC')
            .getMany();
    }}
