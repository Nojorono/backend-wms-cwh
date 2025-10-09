import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryTrackingRepository } from './inventory-tracking.repository';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';
import { InventoryTracking, ProgressionStatus } from '../core/domain/entities/inventory-tracking.entity';

@Injectable()
export class InventoryTrackingService {
  constructor(
    private readonly repository: InventoryTrackingRepository, 
   ) {}

  async create(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    return this.repository.create(dto);
  }

  async findAll(): Promise<InventoryTracking[]> {
    return this.repository.findAll();
  }
  
  async findAllByWarehouse(warehouse_sub_id, warehouse_bin_id): Promise<InventoryTracking[]> {
    return this.repository.findAllByWarehouse(warehouse_sub_id, warehouse_bin_id);
  }

  async findOneHistoryByPalletId(pallet_id: string): Promise<InventoryTracking> {
    const entity = await this.repository.findOneHistoryByPalletId(pallet_id);
    if (!entity) {
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

  async updateProgressionStatus(id: string, progression_status: ProgressionStatus): Promise<InventoryTracking> {
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
    inbound_id?: string
  ): Promise<InventoryTracking> {


    const existing = await this.repository.findOneByParams(pallet_id, warehouse_sub_id, warehouse_id);
    
    if (existing) {
      // Jika sudah ada di lokasi yang sama, update saja
      return this.update(existing.id, { 
        inventory_status: inventory_status,
        inventory_note: 'Inventory tracking updated',
        inventory_date: new Date(),
        inbound_id: inbound_id
      });
    }

    // Create new tracking record
    return this.create({ 
      pallet_id, 
      warehouse_sub_id, 
      warehouse_id, 
      inventory_date: new Date(), 
      inventory_status: inventory_status, 
      inventory_note: 'Inventory tracking created',
      inbound_id: inbound_id
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
    // Jika ada inbound_id, cek apakah sudah ada history dengan inbound_id yang sama
    if (dto.inbound_id) {
      const existingHistory = await this.repository.findHistoryByInboundId(dto.inbound_id);
      if (existingHistory) {
        throw new Error(`History dengan inbound_id ${dto.inbound_id} sudah ada. Tidak dapat membuat duplikasi.`);
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
    inbound_id?: string
  ): Promise<InventoryTracking> {
    // Jika ada inbound_id, cek apakah sudah ada history dengan inbound_id yang sama
    if (inbound_id) {
      const existingHistory = await this.repository.findHistoryByInboundId(inbound_id);
      if (existingHistory) {
        // Jika sudah ada history dengan inbound_id yang sama, return existing tracking
        const existingTracking = await this.repository.findOneByParams(pallet_id, warehouse_sub_id, warehouse_id);
        if (existingTracking) {
          return existingTracking;
        }
        // Jika tidak ada tracking yang sesuai, throw error
        throw new Error(`History dengan inbound_id ${inbound_id} sudah ada untuk inbound transaction yang berbeda.`);
      }
    }

    // Lanjutkan dengan createOrUpdate normal
    return this.createOrUpdateInventoryTracking(pallet_id, warehouse_sub_id, warehouse_id, inventory_status, inbound_id);
  }
}


