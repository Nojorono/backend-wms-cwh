import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Inbound } from '../core/domain/entities/inbound.entity';
import { InboundRepository } from './repositories/inbound.repository';
import { InboundDoRepository } from './repositories/inbound-do.repository';
import { InboundItemRepository } from './repositories/inbound-item.repository';
import { CreateInboundDto } from './dto/create-inbound.dto';
import { UpdateInboundDto, UpdateInboundStatusDto } from './dto/update-inbound.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { InboundPaginationQueryDto } from './dto/inbound-pagination.dto';
import { PaginationService } from '../core/services/pagination.service';

@Injectable()
export class InboundService {
  constructor(
    private readonly inboundRepo: InboundRepository,
    private readonly inboundDoRepo: InboundDoRepository,
    private readonly inboundItemRepo: InboundItemRepository,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService,
  ) {}

  private async generateSequentialInboundNumber(now: Date): Promise<string> {
    return await this.inboundRepo.getNextInboundNumberForDate(now);
  }

  async create(payload: CreateInboundDto): Promise<Inbound> {
    return await this.dataSource.transaction(async () => {
      const inbound_number = await this.generateSequentialInboundNumber(new Date());
      const inbound = await this.inboundRepo.create({
        inbound_number,
        expedition: payload.expedition,
        origin: payload.origin,
        license_plate: payload.license_plate,
        driver_name: payload.driver_name,
        driver_phone: payload.driver_phone,
        status: payload.status,
        inbound_type: payload.inbound_type,
        arrival_date: payload.arrival_date ? new Date(payload.arrival_date) : undefined,
      });

      if (payload.inbound_dos?.length) {
        for (const doDto of payload.inbound_dos) {
          const inboundDo = await this.inboundDoRepo.create({
            inbound_id: inbound.id,
            inbound_do_number: doDto.inbound_do_number,
            inbound_do_date: doDto.inbound_do_date ? new Date(doDto.inbound_do_date) : undefined,
            attachment: doDto.attachment,
            inbound_po_number: doDto.inbound_po_number,
            inbound_po_date: doDto.inbound_po_date ? new Date(doDto.inbound_po_date) : undefined,
            flag_validated: doDto.flag_validated ?? false,
          });
          if (doDto.inbound_items?.length) {
            for (const itemDto of doDto.inbound_items) {
              await this.inboundItemRepo.create({
                inbound_id: inbound.id,
                inbound_do_id: inboundDo.id,
                item_id: itemDto.item_id,
                quantity: itemDto.quantity,
                classification_id: itemDto.classification_id,
                uom: itemDto.uom,
              });
            }
          }
        }
      }

      const created = await this.inboundRepo.findOne(inbound.id);
      if (!created) {
        throw new NotFoundException('Failed to reload created inbound');
      }
      return created;
    });
  }

  async findAll(status?: string): Promise<Inbound[]> {
    let parents = await this.inboundRepo.findAll(status);
    for (const p of parents) {
      const dos = await this.inboundDoRepo.findAllByInbound(p.id);
      for (const d of dos) {
        const items = await this.inboundItemRepo.findAllByInboundDo(d.id);
        (d as any).inbound_items = items;
      }
      (p as any).inbound_dos = dos;
    }
    return parents;
  }

  async findAllPaginated(
    paginationQuery: InboundPaginationQueryDto,
  ): Promise<PaginatedResponseDto<Inbound>> {
    const filters = {
      status: paginationQuery.status,
    };

    const { data, total } = await this.inboundRepo.findAllPaginated(
      filters,
      paginationQuery.page,
      paginationQuery.limit,
      paginationQuery.search,
      paginationQuery.sortBy,
      paginationQuery.sortOrder,
    );

    for (const p of data) {
      const dos = await this.inboundDoRepo.findAllByInbound(p.id);
      for (const d of dos) {
        const items = await this.inboundItemRepo.findAllByInboundDo(d.id);
        (d as any).inbound_items = items;
      }
      (p as any).inbound_dos = dos;
    }

    const paginatedResponse = this.paginationService.createPaginatedResponse(
      data,
      paginationQuery,
      total,
    );

    // Return the paginated response directly to avoid double wrapping
    return paginatedResponse;
  }

  async findOne(id: string): Promise<Inbound> {
    const found = await this.inboundRepo.findOne(id);
    if (!found) {
      throw new NotFoundException('Inbound not found');
    }
    const dos = await this.inboundDoRepo.findAllByInbound(found.id);
    for (const d of dos) {
      const items = await this.inboundItemRepo.findAllByInboundDo(d.id);
      (d as any).inbound_items = items;
    }
    (found as any).inbound_dos = dos;
    return found;
  }

  async update(id: string, payload: UpdateInboundDto): Promise<Inbound> {
    await this.findOne(id);
    await this.dataSource.transaction(async () => {
      await this.inboundRepo.update(id, {
        expedition: payload.expedition,
        origin: payload.origin,
        license_plate: payload.license_plate,
        driver_name: payload.driver_name,
        driver_phone: payload.driver_phone,
        status: payload.status,
        inbound_type: payload.inbound_type,
        arrival_date: payload.arrival_date ? new Date(payload.arrival_date) : undefined,
      });

      if (payload.inbound_dos) {
        await this.inboundItemRepo.softRemoveByInbound(id);
        await this.inboundDoRepo.softRemoveByInbound(id);
        for (const doDto of payload.inbound_dos) {
          const inboundDo = await this.inboundDoRepo.create({
            inbound_id: id,
            inbound_do_number: doDto.inbound_do_number,
            inbound_do_date: doDto.inbound_do_date ? new Date(doDto.inbound_do_date) : undefined,
            attachment: doDto.attachment,
            inbound_po_number: doDto.inbound_po_number,
            inbound_po_date: doDto.inbound_po_date ? new Date(doDto.inbound_po_date) : undefined,
            flag_validated: doDto.flag_validated ?? false,
          });
          if (doDto.inbound_items?.length) {
            for (const itemDto of doDto.inbound_items) {
              await this.inboundItemRepo.create({
                inbound_id: id,
                inbound_do_id: inboundDo.id,
                item_id: itemDto.item_id,
                quantity: itemDto.quantity,
                classification_id: itemDto.classification_id,
                uom: itemDto.uom,
              });
            }
          }
        }
      }
    });
    const updated = await this.inboundRepo.findOne(id);
    if (!updated) {
      throw new NotFoundException('Inbound not found after update');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.dataSource.transaction(async () => {
      await this.inboundItemRepo.softRemoveByInbound(id);
      await this.inboundDoRepo.softRemoveByInbound(id);
      await this.inboundRepo.remove(id);
    });
  }

  async updateStatus(id: string, payload: UpdateInboundStatusDto): Promise<Inbound> {
    await this.findOne(id);
    await this.inboundRepo.update(id, { status: payload.status });
    return this.findOne(id);
  }
}


