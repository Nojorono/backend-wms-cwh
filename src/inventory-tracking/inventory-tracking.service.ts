import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTrackingRepository } from './inventory-tracking.repository';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';
import {
  InventoryTracking,
  ProgressionStatus,
} from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingHistory } from '../core/domain/entities/inventory-tracking-history.entity';
import { PalletTransactionHistory } from '../core/domain/entities/transaction-pallet-history.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { InventoryTrackingPaginationQueryDto } from './dto/inventory-tracking-pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { CreateInventoryTrackingBadDto } from './dto/create-inventory-bad.dto';
import { InventoryTrackingBad } from 'src/core/domain/entities/inventory-tracking-bad.entity';

@Injectable()
export class InventoryTrackingService {
  constructor(
    private readonly repository: InventoryTrackingRepository,
    private readonly paginationService: PaginationService,
    private readonly masterPalletService: MasterPalletService,
    @InjectRepository(PalletTransactionHistory)
    private readonly palletHistoryRepository: Repository<PalletTransactionHistory>,
  ) { }

  // Validasi status yang diperbolehkan
  private validateInventoryStatus(status: string): void {
    const allowedStatuses = [
      'INSPECTION_PENDING',
      'INSPECTION_COMPLETED',
      'IN_INVENTORY',
      'PICKED',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid inventory status: ${status}. Allowed statuses: ${allowedStatuses.join(', ')}`,
      );
    }
  }

  // Validasi progression status
  private validateProgressionStatus(status: ProgressionStatus): void {
    const allowedStatuses = Object.values(ProgressionStatus);
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid progression status: ${status}. Allowed statuses: ${allowedStatuses.join(', ')}`,
      );
    }
  }

  /**
   * Validasi dan resolve: jika existing record dengan lokasi null → return existing (untuk di-update).
   * Jika duplicate (existing dengan lokasi warehouse_sub/bin) → throw.
   * Lainnya → return null (akan create baru).
   */
  private async validatePalletIdUniqueness(
    pallet_id: string,
  ): Promise<InventoryTracking | null> {
    const existing = await this.repository.findOneByPalletId(pallet_id);

    const hasExistingWithLocation =
      existing != null &&
      (existing.warehouse_sub_id != null || existing.warehouse_bin_id != null);

    if (hasExistingWithLocation) {
      throw new BadRequestException(
        `Pallet dengan ID ${pallet_id} sudah memiliki inventory tracking record di lokasi (warehouse_sub/bin). Tidak dapat membuat duplikasi.`,
      );
    }
    // Existing dengan warehouse_sub_id & warehouse_bin_id null → pakai update (ignore historyCount)
    if (
      existing != null &&
      existing.warehouse_sub_id == null &&
      existing.warehouse_bin_id == null
    ) {
      return existing;
    }
    return null;
  }

  async create(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    if (dto.inventory_status) {
      this.validateInventoryStatus(dto.inventory_status);
    }

    if (dto.pallet_id) {
      const existingToUpdate = await this.validatePalletIdUniqueness(dto.pallet_id);
      if (existingToUpdate != null) {
        const updatePayload: UpdateInventoryTrackingDto = {};
        if (dto.warehouse_id !== undefined) updatePayload.warehouse_id = dto.warehouse_id;
        if (dto.warehouse_sub_id !== undefined) updatePayload.warehouse_sub_id = dto.warehouse_sub_id;
        if (dto.warehouse_bin_id !== undefined) updatePayload.warehouse_bin_id = dto.warehouse_bin_id;
        if (dto.inventory_status !== undefined) updatePayload.inventory_status = dto.inventory_status;
        if (dto.inventory_note !== undefined) updatePayload.inventory_note = dto.inventory_note;
        if (dto.inventory_date !== undefined) updatePayload.inventory_date = dto.inventory_date;
        if (dto.progression_status !== undefined) updatePayload.progression_status = dto.progression_status;
        const updated = await this.update(existingToUpdate.id, updatePayload);
        const [enriched] = await this.enrichPalletsWithCurrentItems([updated]);
        return enriched;
      }
    }

    const created = await this.repository.create(dto);
    const enriched = await this.enrichPalletsWithCurrentItems([created]);
    return enriched[0];
  }

  async findAll(organizationId: string): Promise<InventoryTracking[]> {
    const inventoryTrackings = await this.repository.findAll(organizationId);
    return await this.enrichPalletsWithCurrentItems(inventoryTrackings);
  }

  async findAllPaginated(
    paginationQuery: InventoryTrackingPaginationQueryDto,
    organizationId: string,
  ): Promise<PaginatedResponseDto<InventoryTracking>> {
    const filters = {
      inventory_status: paginationQuery.inventory_status,
      warehouse_id: paginationQuery.warehouse_id,
      warehouse_sub_id: paginationQuery.warehouse_sub_id,
      warehouse_bin_id: paginationQuery.warehouse_bin_id,
      pallet_id: paginationQuery.pallet_id,
      progression_status: paginationQuery.progression_status,
      item_id: paginationQuery.item_id,
    };

    const { data, total } = await this.repository.findAllPaginated(
      filters,
      paginationQuery.page,
      paginationQuery.limit,
      paginationQuery.search,
      paginationQuery.sortBy,
      paginationQuery.sortOrder,
      organizationId,
    );

    const enrichedData = await this.enrichPalletsWithCurrentItems(data);

    return this.paginationService.createPaginatedResponse(enrichedData, paginationQuery, total);
  }

  /**
   * Enrich inventory tracking pallets with current items data
   */
  private async enrichPalletsWithCurrentItems(
    inventoryTrackings: InventoryTracking[],
  ): Promise<InventoryTracking[]> {
    for (const tracking of inventoryTrackings) {
      if (tracking.pallet && tracking.pallet.id) {
        try {
          const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(
            tracking.pallet.id,
          );
          // Add currentItems array to the pallet object
          (tracking.pallet as any).currentItems = palletItems.map((item) => ({
            item_id: item.item_id,
            item_name: item.item_name,
            current_quantity: item.current_quantity,
            uom: item.uom,
            production_date: item.production_date,
            week_number: item.week_number,
          }));
        } catch (error) {
          // If pallet not found or error, set empty array
          (tracking.pallet as any).currentItems = [];
        }
      }
    }
    return inventoryTrackings;
  }

  async findAllByWarehouse(warehouse_sub_id, warehouse_bin_id): Promise<InventoryTracking[]> {
    const inventoryTrackings = await this.repository.findAllByWarehouse(warehouse_sub_id, warehouse_bin_id);
    return await this.enrichPalletsWithCurrentItems(inventoryTrackings);
  }

  async findHistoryByPalletId(pallet_id: string): Promise<InventoryTrackingHistory[]> {
    const entity = await this.repository.findHistoryByPalletId(pallet_id);
    if (!entity || entity.length === 0) {
      throw new NotFoundException(`InventoryTracking with pallet ID ${pallet_id} not found`);
    }
    return entity;
  }

  async findOne(id: string): Promise<InventoryTracking> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`InventoryTracking with ID ${id} not found`);
    }
    const enriched = await this.enrichPalletsWithCurrentItems([entity]);
    return enriched[0];
  }

  async findOneByPalletId(palletId: string): Promise<InventoryTracking> {
    const entity = await this.repository.findOneByPalletId(palletId);
    if (!entity) {
      throw new NotFoundException(`InventoryTracking with pallet ID ${palletId} not found`);
    }
    const enriched = await this.enrichPalletsWithCurrentItems([entity]);
    return enriched[0];
  }

  async findAllByPalletId(palletId: string, inventory_status?: string): Promise<InventoryTracking[]> {
    return await this.repository.findAllByPalletId(palletId, inventory_status);
  }

  async updateByPalletId(palletId: string, dto: UpdateInventoryTrackingDto): Promise<InventoryTracking> {
    const existing = await this.repository.findOneByPalletId(palletId);
    if (!existing) {
      throw new NotFoundException(`InventoryTracking with pallet ID ${palletId} not found`);
    }
    return this.update(existing.id, dto);
  }

  /**
   * Update inventory tracking by pallet ID if it exists; otherwise create a new record.
   * Use when destination pallets (e.g. from split) may not have tracking yet.
   */
  async updateByPalletIdOrCreate(
    palletId: string,
    dto: UpdateInventoryTrackingDto,
  ): Promise<InventoryTracking> {
    const existing = await this.repository.findOneByPalletId(palletId);
    if (existing) {
      return this.update(existing.id, dto);
    }
    return this.create({
      pallet_id: palletId,
      warehouse_id: dto.warehouse_id,
      warehouse_sub_id: dto.warehouse_sub_id,
      warehouse_bin_id: dto.warehouse_bin_id,
      inventory_status: dto.inventory_status,
      progression_status: dto.progression_status,
      inventory_note: dto.inventory_note,
      inventory_date: dto.inventory_date,
    } as CreateInventoryTrackingDto);
  }

  async update(id: string, dto: UpdateInventoryTrackingDto): Promise<InventoryTracking> {
    // Validasi status jika ada
    if (dto.inventory_status) {
      this.validateInventoryStatus(dto.inventory_status);
    }

    // Validasi duplikasi pallet_id jika ada perubahan
    // if (dto.pallet_id) {
    //   const await this.validatePalletIdUniqueness(dto.pallet_id);
    // }

    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`InventoryTracking with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async updateProgressionStatus(
    id: string,
    progression_status: ProgressionStatus,
  ): Promise<InventoryTracking> {
    // Validasi progression status
    this.validateProgressionStatus(progression_status);

    const updated = await this.repository.updateProgressionStatus(id, progression_status);
    if (!updated) {
      throw new NotFoundException(`InventoryTracking with ID ${id} not found`);
    }
    return updated;
  }

  /**
   * Direct update of inventory_status to IN_INVENTORY (e.g. revert on transaction picking cancel).
   * Bypasses full update/history flow to ensure status is persisted.
   */
  async updateStatusToInInventory(id: string, note: string): Promise<InventoryTracking> {
    const updated = await this.repository.updateStatusToInInventory(id, note);
    if (!updated) {
      throw new NotFoundException(`InventoryTracking with ID ${id} not found`);
    }
    return updated;
  }

  async createOrUpdateInventoryTracking(
    pallet_id: string,
    warehouse_sub_id: string,
    warehouse_id: string,
    inventory_status: string,
    inbound_id?: string,
  ): Promise<any> {
    // Validasi status
    this.validateInventoryStatus(inventory_status);

    const existing = await this.validatePalletIdUniqueness(pallet_id);

    console.log("existing", existing);

    if (existing) {
      // Jika sudah ada di lokasi yang sama, update saja
      return this.update(existing.id, {
        warehouse_sub_id,
        warehouse_id,
        inventory_status: inventory_status,
        inventory_note: 'Inventory tracking updated',
        inventory_date: new Date(),
        inbound_id: inbound_id,
      });
    }

    // Validasi duplikasi pallet_id sebelum create
    // await this.validatePalletIdUniqueness(pallet_id);

    // Create new tracking record
    return this.create({
      pallet_id,
      warehouse_sub_id,
      warehouse_id,
      inventory_date: new Date(),
      inventory_status: inventory_status,
      inventory_note: 'Inventory tracking created',
      inbound_id: inbound_id,
    });
  }

  async findByItemId(item_id: string): Promise<any[]> {
    return this.repository.findByItemId(item_id);
  }

  // Method untuk mengecek apakah sudah ada history dengan inbound_id yang sama
  async findHistoryByInboundId(inbound_id: string): Promise<any> {
    return this.repository.findHistoryByInboundId(inbound_id);
  }

  // Method untuk mendapatkan semua history berdasarkan inbound_id
  async findAllHistoryByInboundId(inbound_id: string): Promise<any[]> {
    return this.repository.findAllHistoryByInboundId(inbound_id);
  }

  // Method untuk membuat inventory tracking dengan pengecekan duplikasi inbound_id
  async createWithInboundCheck(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    // Validasi status jika ada
    if (dto.inventory_status) {
      this.validateInventoryStatus(dto.inventory_status);
    }

    // Validasi duplikasi pallet_id
    // if (dto.pallet_id) {
    //   await this.validatePalletIdUniqueness(dto.pallet_id);
    // }

    // Jika ada inbound_id, cek apakah sudah ada history dengan inbound_id yang sama
    if (dto.inbound_id) {
      const existingHistory = await this.repository.findHistoryByInboundId(dto.inbound_id);
      if (existingHistory) {
        throw new BadRequestException(
          `History dengan inbound_id ${dto.inbound_id} sudah ada. Tidak dapat membuat duplikasi.`,
        );
      }
    }

    const created = await this.repository.create(dto);
    const enriched = await this.enrichPalletsWithCurrentItems([created]);
    return enriched[0];
  }

  // Method untuk createOrUpdate dengan pengecekan duplikasi inbound_id
  async createOrUpdateInventoryTrackingWithInboundCheck(
    pallet_id: string,
    warehouse_sub_id: string,
    warehouse_id: string,
    inventory_status: string,
    inbound_id?: string,
  ): Promise<InventoryTracking> {
    // Validasi status
    this.validateInventoryStatus(inventory_status);

    // Jika ada inbound_id, cek apakah sudah ada history dengan inbound_id yang sama
    if (inbound_id) {
      const existingHistory = await this.repository.findHistoryByInboundId(inbound_id);
      if (existingHistory) {
        // Jika sudah ada history dengan inbound_id yang sama, return existing tracking
        const existingTracking = await this.repository.findOneByParams(
          pallet_id,
          warehouse_sub_id,
          warehouse_id,
        );
        if (existingTracking) {
          return existingTracking;
        }
        // Jika tidak ada tracking yang sesuai, throw error
        throw new BadRequestException(
          `History dengan inbound_id ${inbound_id} sudah ada untuk inbound transaction yang berbeda.`,
        );
      }
    }

    // Validasi duplikasi pallet_id sebelum createOrUpdate
    // await this.validatePalletIdUniqueness(pallet_id);

    // Lanjutkan dengan createOrUpdate normal
    return this.createOrUpdateInventoryTracking(
      pallet_id,
      warehouse_sub_id,
      warehouse_id,
      inventory_status,
      inbound_id,
    );
  }

  // Method untuk validasi pallet
  async validatePallet(pallet_code: string): Promise<{
    success: boolean;
    message: string;
    pallet_code: string;
    pallet_id: string | null;
    is_available: boolean;
    can_use: boolean;
    pallet_status: {
      exists: boolean;
      is_active: boolean;
      is_full: boolean;
      current_quantity: number;
      capacity: number;
    };
    existing_tracking: InventoryTracking | null;
    can_create: boolean;
    reasons: string[];
    items: any[];
  }> {
    try {
      const reasons: string[] = [];
      let canUse = true;
      let isAvailable = true;

      // 1. Cek apakah pallet ada di master pallet berdasarkan pallet_code
      const pallet = await this.repository.findPalletByCode(pallet_code);
      if (!pallet) {
        return {
          success: false,
          message: 'Pallet tidak ditemukan dalam sistem.',
          pallet_code,
          pallet_id: null,
          is_available: false,
          can_use: false,
          pallet_status: {
            exists: false,
            is_active: false,
            is_full: false,
            current_quantity: 0,
            capacity: 0,
          },
          existing_tracking: null,
          can_create: false,
          reasons: ['Pallet tidak ditemukan dalam sistem'],
          items: [],
        };
      }

      // Get all items on the pallet (filter out items with zero quantity)
      let palletItems: any[] = [];
      try {
        const allItems = await this.masterPalletService.getPalletItemLatestQuantity(pallet.id);
        // Filter out items with current_quantity = 0
        palletItems = allItems.filter((item) => item.current_quantity > 0);
      } catch (error) {
        // If error getting items, continue with empty array
        console.warn(`Failed to get items for pallet ${pallet.id}:`, error);
        palletItems = [];
      }

      // 2. Cek status pallet
      if (!pallet.isActive) {
        canUse = false;
        reasons.push('Pallet tidak aktif');
      }

      if (pallet.isFull) {
        canUse = false;
        reasons.push('Pallet sudah penuh');
      }

      // 3. Cek apakah pallet sudah memiliki inventory tracking dan statusnya
      const existingTracking = await this.repository.findOneByPalletId(pallet.id);
      if (existingTracking) {
        // Cek status inventory tracking
        if (
          existingTracking.inventory_status === 'IN_INVENTORY' ||
          existingTracking.inventory_status === 'INSPECTION_PENDING' ||
          existingTracking.inventory_status === 'INSPECTION_COMPLETED'
        ) {
          isAvailable = false;
          reasons.push(
            `Pallet masih dalam proses inventory dengan status: ${existingTracking.inventory_status}`,
          );
        } else if (existingTracking.inventory_status === 'PICKED') {
          isAvailable = false;
          reasons.push(
            `Pallet sedang dalam proses picking dengan status: ${existingTracking.inventory_status}`,
          );
        }
      }

      // 4. Cek kapasitas pallet
      if (pallet.currentQuantity >= pallet.capacity) {
        canUse = false;
        reasons.push(
          `Pallet sudah mencapai kapasitas maksimal (${pallet.currentQuantity}/${pallet.capacity})`,
        );
      }

      const canCreate = canUse && isAvailable;

      return {
        success: canCreate,
        message: canCreate
          ? 'Pallet dapat digunakan untuk inventory tracking.'
          : `Pallet tidak dapat digunakan: ${reasons.join(', ')}`,
        pallet_code,
        pallet_id: pallet.id,
        is_available: isAvailable,
        can_use: canUse,
        pallet_status: {
          exists: true,
          is_active: pallet.isActive,
          is_full: pallet.isFull,
          current_quantity: pallet.currentQuantity,
          capacity: pallet.capacity,
        },
        existing_tracking: existingTracking,
        can_create: canCreate,
        reasons,
        items: palletItems,
      };
    } catch (error) {
      throw new BadRequestException(`Error validating pallet: ${error.message}`);
    }
  }

  async getVisibilityInventoryTrackingAllItemInWarehouse(organizationId: string, item_id?: string): Promise<{
    summary: {
      total_items: number;
      total_quantity: number;
      total_booked_quantity: number;
      total_available_quantity: number;
      items_with_pending_bookings: number;
    };
    items: any[];
  }> {
    try {
      const items = await this.repository.getVisibilityDashboard(organizationId, item_id);

      // Calculate summary statistics (ensure numeric conversion)
      const summary = {
        total_items: items.length,
        total_quantity: items.reduce((sum, item) => sum + (Number(item.total_quantity) || 0), 0),
        total_booked_quantity: items.reduce((sum, item) => sum + (Number(item.booked_quantity) || 0), 0),
        total_available_quantity: items.reduce((sum, item) => sum + (Number(item.available_quantity) || 0), 0),
        items_with_pending_bookings: items.filter((item) => item.has_pending_booking).length,
      };

      return {
        summary,
        items,
      };
    } catch (error) {
      throw new BadRequestException(`Error getting visibility dashboard: ${error.message}`);
    }
  }

  async createInventoryTrackingBad(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    return this.repository.createInventoryTrackingBad(dto);
  }
}
