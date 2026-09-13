import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppLoggerService } from '../infrastructure/services/logger.service';
import { InboundReturRepository } from './inbound-retur.repository';
import { CreateInboundReturDto } from './dto/create-inbound-retur.dto';
import { UpdateInboundReturDto, UpdateInboundReturStatusDto } from './dto/update-inbound-retur.dto';
import { InboundReturPaginationQueryDto } from './dto/inbound-retur-pagination.dto';
import { InboundRetur, InboundReturStatus } from '../core/domain/entities/inbound-retur.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { CreateInboundReturHelperDto } from './dto/create-inbound-retur-helper.dto';
import { InboundReturHelper } from 'src/core/domain/entities/inbound-retur-helper.entity';
import { CreateInboundReturSortingDto } from './dto/create-inbound-retur-sorting.dto';
import { InboundReturSorting } from 'src/core/domain/entities/inbound-retur-sorting.entity';
import { UpdateInboundReturSortingDto } from './dto/update-inbound-retur-sorting.dto';
import { InventoryTrackingService } from 'src/inventory-tracking/inventory-tracking.service';
import { InventoryTrackingBadService } from 'src/inventory-tracking/inventory-tracking-bad.service';

@Injectable()
export class InboundReturService {
  private static readonly LOG_CONTEXT = 'InboundReturService';

  constructor(
    private readonly repository: InboundReturRepository,
    private readonly paginationService: PaginationService,
    private readonly logger: AppLoggerService,
    private readonly inventoryTrackingService: InventoryTrackingService,
    private readonly inventoryTrackingBadService: InventoryTrackingBadService,
  ) { }

  /** Log error to error log (message + stack). Use in catch blocks. */
  private logError(error: unknown, operation?: string): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const prefix = operation ? `[${operation}] ` : '';
    this.logger.error(prefix + message, stack, InboundReturService.LOG_CONTEXT);
  }

  async create(payload: CreateInboundReturDto): Promise<InboundRetur> {
    try {
      const inbound_retur_number = await this.repository.getNextInboundReturNumber();
      const created = await this.repository.create({
        ...payload,
        inbound_retur_number,
        status: payload.status ?? InboundReturStatus.CREATED,
      });
      this.logger.log(
        `Inbound retur created: ${created.inbound_retur_number} (id: ${created.id})`,
        InboundReturService.LOG_CONTEXT,
      );
      return created;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logError(error, 'create');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create inbound retur: ${message}`);
    }
  }

  async findAll(status?: string): Promise<InboundRetur[]> {
    return await this.repository.findAll(status);
  }

  async findAllPaginated(
    query: InboundReturPaginationQueryDto,
  ): Promise<PaginatedResponseDto<InboundRetur>> {
    const { data, total } = await this.repository.findAllPaginated(
      { status: query.status },
      query.page ?? 1,
      query.limit ?? 10,
      query.search,
      query.sortBy ?? 'createdAt',
      (query.sortOrder as 'ASC' | 'DESC') ?? 'DESC',
    );
    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<InboundRetur> {
    const found = await this.repository.findOne(id);
    if (!found) throw new NotFoundException('Inbound retur not found');
    return found;
  }

  async update(id: string, payload: UpdateInboundReturDto): Promise<InboundRetur> {
    try {
      await this.findOne(id);
      const updated = await this.repository.update(id, payload);
      this.logger.log(`Inbound retur updated: id=${id}`, InboundReturService.LOG_CONTEXT);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logError(error, 'update');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update inbound retur: ${message}`);
    }
  }

  async updateStatus(id: string, payload: UpdateInboundReturStatusDto): Promise<InboundRetur> {
    try {
      const inboundRetur = await this.findOne(id);
      if (!inboundRetur) throw new NotFoundException('Inbound retur not found');
      if (inboundRetur.status === payload.status) {
        this.logger.warn(`Inbound retur status unchanged: id=${id}, status=${payload.status}`, InboundReturService.LOG_CONTEXT);
        throw new BadRequestException('Inbound retur status is already the same');
      }
      const updated = await this.repository.update(id, { status: payload.status });
      if (!updated) throw new BadRequestException('Failed to update inbound retur status');
      this.logger.log(
        `Inbound retur status updated: id=${id}, ${inboundRetur.status} -> ${payload.status}`,
        InboundReturService.LOG_CONTEXT,
      );
      if (payload.status === InboundReturStatus.COMPLETED) {
        for (const item of inboundRetur.inbound_retur_sortings) {
          if (item.quantity_claim > 0) {
          const inventoryTracking = await this.inventoryTrackingService.createInventoryTrackingBad({
            warehouse_sub_id: item.warehouse_sub_id_claim,
              inventory_status: 'IN_INVENTORY',
              inbound_id: inboundRetur.id,
            });
            await this.inventoryTrackingBadService.createOrUpdate({
              inbound_retur_id: inboundRetur.id,
              inventory_tracking_id: inventoryTracking.id,
              item_id: item.item_id,
              quantity: item.quantity_claim,
              uom: item.uom,
              production_date: item.production_date.toISOString(),
              year: parseInt(item.year),
              hje: item.hje,
              notes: item.notes,
            });
          }
          if (item.quantity_unclaim > 0) {
            const inventoryTracking = await this.inventoryTrackingService.createInventoryTrackingBad({
              warehouse_sub_id: item.warehouse_sub_id_unclaim,
              inventory_status: 'IN_INVENTORY',
              inbound_id: inboundRetur.id,
            });
            await this.inventoryTrackingBadService.createOrUpdate({
              inbound_retur_id: inboundRetur.id,
              inventory_tracking_id: inventoryTracking.id,
              item_id: item.item_id,
              quantity: item.quantity_unclaim,
              uom: item.uom,
              production_date: item.production_date.toISOString(),
              year: parseInt(item.year),
              hje: item.hje,
              notes: item.notes,
            });
          } 
          if (item.quantity_tracking > 0) {
            const inventoryTracking = await this.inventoryTrackingService.createInventoryTrackingBad({
              warehouse_sub_id: item.warehouse_sub_id_tracking,
              inventory_status: 'IN_INVENTORY',
              inbound_id: inboundRetur.id,
            });
            await this.inventoryTrackingBadService.createOrUpdate({
              inbound_retur_id: inboundRetur.id,
              inventory_tracking_id: inventoryTracking.id,
              item_id: item.item_id,
              quantity: item.quantity_tracking,
              uom: item.uom,
              production_date: item.production_date.toISOString(),
              year: parseInt(item.year),
              hje: item.hje,
              notes: item.notes,
            });
          }
        }
      }
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.logError(error, 'updateStatus');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update inbound retur status: ${message}`);
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
    this.logger.log(`Inbound retur removed: id=${id}`, InboundReturService.LOG_CONTEXT);
  }

  async createHelpers(payload: CreateInboundReturHelperDto): Promise<InboundReturHelper> {
    return await this.repository.createHelpers(payload);
  }

  async deleteHelper(id: string): Promise<void> {
    return await this.repository.deleteHelper(id);
  }

  async createSorting(payload: CreateInboundReturSortingDto[]): Promise<InboundReturSorting[]> {
    return await this.repository.createSorting(payload);
  }

  async updateSorting(id: string, payload: UpdateInboundReturSortingDto): Promise<InboundReturSorting> {
    try {
      return await this.repository.updateSorting(id, payload);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logError(error, 'updateSorting');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update inbound retur sorting: ${message}`);
    }
  }

  async deleteSorting(id: string): Promise<void> {
    try {
      return await this.repository.deleteSorting(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logError(error, 'deleteSorting');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete inbound retur sorting: ${message}`);
    }
  }
}
