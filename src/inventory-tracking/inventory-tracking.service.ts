import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryTrackingRepository } from './inventory-tracking.repository';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';
import {
  InventoryTracking,
  ProgressionStatus,
} from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingHistory } from '../core/domain/entities/inventory-tracking-history.entity';

@Injectable()
export class InventoryTrackingService {
  constructor(private readonly repository: InventoryTrackingRepository) {}

  // Validasi status yang diperbolehkan
  private validateInventoryStatus(status: string): void {
    const allowedStatuses = [
      'INSPECTION_PENDING',
      'INSPECTION_COMPLETED',
      'IN_INVENTORY',
      'PICKED',
      'SHIPPED',
      'RETURNED',
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

  // Validasi duplikasi pallet_id
  private async validatePalletIdUniqueness(pallet_id: string, excludeId?: string): Promise<void> {
    const existing = await this.repository.findOneByPalletId(pallet_id);
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException(
        `Pallet dengan ID ${pallet_id} sudah memiliki inventory tracking record. Tidak dapat membuat duplikasi.`,
      );
    }
  }

  async create(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    // Validasi status jika ada
    if (dto.inventory_status) {
      this.validateInventoryStatus(dto.inventory_status);
    }

    // Validasi duplikasi pallet_id
    if (dto.pallet_id) {
      await this.validatePalletIdUniqueness(dto.pallet_id);
    }

    return this.repository.create(dto);
  }

  async findAll(): Promise<InventoryTracking[]> {
    return this.repository.findAll();
  }

  async findAllByWarehouse(warehouse_sub_id, warehouse_bin_id): Promise<InventoryTracking[]> {
    return this.repository.findAllByWarehouse(warehouse_sub_id, warehouse_bin_id);
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
    return entity;
  }

  async update(id: string, dto: UpdateInventoryTrackingDto): Promise<InventoryTracking> {
    // Validasi status jika ada
    if (dto.inventory_status) {
      this.validateInventoryStatus(dto.inventory_status);
    }

    // Validasi duplikasi pallet_id jika ada perubahan
    if (dto.pallet_id) {
      await this.validatePalletIdUniqueness(dto.pallet_id, id);
    }

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

  async createOrUpdateInventoryTracking(
    pallet_id: string,
    warehouse_sub_id: string,
    warehouse_id: string,
    inventory_status: string,
    inbound_id?: string,
  ): Promise<InventoryTracking> {
    // Validasi status
    this.validateInventoryStatus(inventory_status);

    const existing = await this.repository.findOneByParams(
      pallet_id,
      warehouse_sub_id,
      warehouse_id,
    );

    if (existing) {
      // Jika sudah ada di lokasi yang sama, update saja
      return this.update(existing.id, {
        inventory_status: inventory_status,
        inventory_note: 'Inventory tracking updated',
        inventory_date: new Date(),
        inbound_id: inbound_id,
      });
    }

    // Validasi duplikasi pallet_id sebelum create
    await this.validatePalletIdUniqueness(pallet_id);

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
    if (dto.pallet_id) {
      await this.validatePalletIdUniqueness(dto.pallet_id);
    }

    // Jika ada inbound_id, cek apakah sudah ada history dengan inbound_id yang sama
    if (dto.inbound_id) {
      const existingHistory = await this.repository.findHistoryByInboundId(dto.inbound_id);
      if (existingHistory) {
        throw new BadRequestException(
          `History dengan inbound_id ${dto.inbound_id} sudah ada. Tidak dapat membuat duplikasi.`,
        );
      }
    }

    return this.repository.create(dto);
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
    await this.validatePalletIdUniqueness(pallet_id);

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
        };
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
        } else if (existingTracking.inventory_status === 'SHIPPED') {
          // Cek apakah outbound sudah done
          const isOutboundDone = await this.checkOutboundStatus(pallet.id);
          if (isOutboundDone) {
            // Pallet sudah keluar/outbound done - bisa digunakan kembali
            isAvailable = true;
            reasons.push(`Pallet sudah keluar/outbound done - dapat digunakan kembali`);
          } else {
            isAvailable = false;
            reasons.push(`Pallet sudah shipped tapi outbound belum selesai`);
          }
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
      };
    } catch (error) {
      throw new BadRequestException(`Error validating pallet: ${error.message}`);
    }
  }

  // Method untuk mengecek status outbound
  private async checkOutboundStatus(pallet_id: string): Promise<boolean> {
    try {
      // Cek apakah ada outbound transaction yang sudah done untuk pallet ini
      // Implementasi ini bisa disesuaikan dengan struktur outbound yang ada
      // Untuk sementara, kita asumsikan jika status SHIPPED maka outbound sudah done
      return true;
    } catch (error) {
      return false;
    }
  }
}
