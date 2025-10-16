import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { UpdateSaldoInspectionDto } from './dto/update-saldo-inspection.dto';
import { BulkUpdateSaldoInspectionDto } from './dto/bulk-update-saldo-inspection.dto';
import { InboundItem } from '../core/domain/entities/inbound-item.entity';
import { IntegrationStatus } from 'src/core/domain/entities/inbound-do.entity';

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
            validation_surat_jalan: doDto.validation_surat_jalan ?? false,
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
    // Relations are now loaded automatically through the repository
    return await this.inboundRepo.findAll(status);
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

    // Relations are now loaded automatically through the repository

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
    // Relations are now loaded automatically through the repository
    return found;
  }

  async update(id: string, payload: UpdateInboundDto): Promise<Inbound> {
    const inbound = await this.findOne(id);

    if (!inbound) {
      throw new NotFoundException('Inbound not found');
    }

    if(inbound.status === 'UNLOADING') {
      throw new BadRequestException('Inbound is already unloading');
    }
    
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
            validation_surat_jalan: doDto.validation_surat_jalan ?? false,
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
    
    const updateData: Partial<Inbound> = {};
    if (payload.status !== undefined) {
      updateData.status = payload.status;
    }
    if (payload.notes !== undefined) {
      updateData.notes = payload.notes;
    }
    
    await this.inboundRepo.update(id, updateData);
    return this.findOne(id);
  }

  async findByAssignedHelperId(id: string): Promise<Inbound[]> {
    return await this.inboundRepo.findByAssignedHelperId(id);
  }

  async findAllTransactionScanInbound(status: string): Promise<Inbound[]> {
    return await this.inboundRepo.findAllTransactionScanInbound(status);
  }

  async bulkUpdateInboundItemSaldoInspection(payload: BulkUpdateSaldoInspectionDto): Promise<InboundItem[]> {
    const updates = payload.items.map(item => ({
      id: item.id,
      quantity_inspection: item.quantity_inspection
    }));
    
    const updateSaldo = await this.inboundItemRepo.bulkUpdateSaldoInspection(updates); 

    await this.inboundDoRepo.update(payload.inbound_do_id, {integration_status: IntegrationStatus.PENDING})

    return updateSaldo;
  }
}


