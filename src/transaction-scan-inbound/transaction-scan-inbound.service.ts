import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionScanInboundRepository } from './transaction-scan-inbound.repository';
import { CreateTransactionScanInboundDto } from './dto/create-transaction-scan-inbound.dto';
import { UpdateManyStatusToDto, UpdateTransactionScanInboundDto } from './dto/update-transaction-scan-inbound.dto';
import { ScanInboundStatus, TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';
import { MasterPalletService } from 'src/master-pallet/master-pallet.service';
import { MasterItemService } from 'src/master-item/master-item.service';
import { MasterWarehouseSubService } from 'src/master-warehouse-sub/master-warehouse-sub.service';
import { QuantityOperationType } from 'src/core/domain/entities/transaction-pallet-history.entity';
import { InventoryTrackingService } from 'src/inventory-tracking/inventory-tracking.service';
import { UpdateResult } from 'typeorm';

@Injectable()
export class TransactionScanInboundService {
  constructor(
    private readonly repository: TransactionScanInboundRepository, 
    private readonly palletService: MasterPalletService,
    private readonly itemService: MasterItemService,
    private readonly warehouseSubService: MasterWarehouseSubService,
    private readonly inventoryTrackingService: InventoryTrackingService
  ) {}

  async create(data: CreateTransactionScanInboundDto): Promise<TransactionScanInbound> {
    const item = await this.itemService.findOne(data.item_id);
    if (!item) throw new BadRequestException('Item not found');

    const pallet = await this.palletService.findByPalletCode(data.pallet_code || '');

    if (!pallet) throw new NotFoundException('Pallet not found');

    // check capacity pallet
    if (pallet && pallet.capacity > 0) {
      const capacityPallet = await this.palletService.checkCapacityForQuantity(pallet.id, data.quantity);
      if (!capacityPallet) throw new BadRequestException('Pallet is full');
    }else if (pallet && pallet.capacity <= 0) {
      throw new BadRequestException('Pallet capacity is not set');
    }

    if (data.m_warehouse_sub_id) {
      const warehouseSub = await this.warehouseSubService.findOne(data.m_warehouse_sub_id);
      if (!warehouseSub) throw new BadRequestException('Warehouse sub not found');
    }

    // Validasi week_number untuk pallet yang sama
    const existingItemsInPallet = await this.repository.findItemsInPalletWithDifferentWeek(pallet.id, data.week_number);
    if (existingItemsInPallet.length > 0) {
      const differentWeekItems = existingItemsInPallet.filter(item => item.week_number !== data.week_number);
      if (differentWeekItems.length > 0) {
        throw new BadRequestException(`Pallet sudah berisi item dengan week ${differentWeekItems[0].week_number}. Tidak dapat menambahkan item dengan week ${data.week_number}`);
      }
    }

    // Validasi untuk inbound yang sama
    const findExistPalletSameWeek = await this.repository.findExistPallet(data.inbound_id, pallet.id);
    if(findExistPalletSameWeek && findExistPalletSameWeek.week_number !== data.week_number) {
      throw new BadRequestException('Item dalam pallet harus memiliki week yang sama dengan item yang sudah ada di inbound ini');
    }

    const scan = await this.repository.create({
      ...data,
      pallet_id: pallet.id,
    });
    await this.palletService.updateQuantityByPalletCode(pallet.pallet_code, {
      production_date: data.production_date,
      item_id: data.item_id,
      quantity: data.quantity,
      operation_type: QuantityOperationType.ADD,
      inbound_id: data.inbound_id,
      reference_id: scan.id,
      reference_type: 'INBOUND_SCAN',
      notes: data.user_name,
      user_id: data.user_id,
      uom: data.uom,
      week_number: data.week_number,
    });
    return scan;
  }

  async findAll(inbound_id: string, status: string, item_id?: string): Promise<TransactionScanInbound[]> {
    return this.repository.findAll(inbound_id, status, item_id);
  }

  async updateInspectionApproved(id: string, status: ScanInboundStatus, inspection_by: string): Promise<TransactionScanInbound> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Transaction scan inbound not found');
    const updated = await this.repository.update(id, { ...existing, status: status, inspection_by: inspection_by });
    // if status is COMPLETED, create or update inventory tracking
    if (status === ScanInboundStatus.COMPLETED) {
      const warehouseSub = await this.warehouseSubService.findOne(existing.m_warehouse_sub_id);
      if (!warehouseSub) throw new NotFoundException('Warehouse sub not found');
      
      // createOrUpdateInventoryTracking now automatically detects location changes
      await this.inventoryTrackingService.createOrUpdateInventoryTracking(
        existing.pallet_id, 
        existing.m_warehouse_sub_id, 
        warehouseSub.warehouse_id, 
        'INSPECTION_COMPLETED', 
        existing.inbound_id
      );
    }
    return updated;
  }

  async findOne(id: string): Promise<TransactionScanInbound> {
    const entity = await this.repository.findOne(id);
    if (!entity) throw new NotFoundException('Transaction scan inbound not found');
    return entity;
  }

  async findByInboundId(inbound_id: string): Promise<TransactionScanInbound[]> {
    return this.repository.findByInboundId(inbound_id);
  }

  async update(id: string, data: UpdateTransactionScanInboundDto): Promise<TransactionScanInbound> {
    try {
      // Validate input parameters
      if (!id || typeof id !== 'string') {
        throw new BadRequestException('Invalid transaction ID provided');
      }

      if (!data || Object.keys(data).length === 0) {
        throw new BadRequestException('No update data provided');
      }

      // Find existing transaction with proper error handling
      const existing = await this.findOne(id);
      if (!existing) {
        throw new NotFoundException(`Transaction scan inbound with ID ${id} not found`);
      }

      // Validate item if being updated
      if (data.item_id) {
        try {
          const item = await this.itemService.findOne(data.item_id);
          if (!item) {
            throw new BadRequestException(`Item with ID ${data.item_id} not found`);
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new BadRequestException(`Failed to validate item: ${error.message}`);
        }
      }

      // Validate warehouse sub if being updated
      if (data.m_warehouse_sub_id) {
        try {
          const warehouseSub = await this.warehouseSubService.findOne(data.m_warehouse_sub_id);
          if (!warehouseSub) {
            throw new BadRequestException(`Warehouse sub with ID ${data.m_warehouse_sub_id} not found`);
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new BadRequestException(`Failed to validate warehouse sub: ${error.message}`);
        }
      }

      // Validate week_number if being updated
      if (data.week_number !== undefined && data.week_number !== existing.week_number) {
        try {
          const existingItemsInPallet = await this.repository.findItemsInPalletWithDifferentWeek(existing.pallet_id, data.week_number);
          const differentWeekItems = existingItemsInPallet.filter(item => item.id !== id && item.week_number !== data.week_number);
          
          if (differentWeekItems.length > 0) {
            throw new BadRequestException(
              `Pallet already contains items with week ${differentWeekItems[0].week_number}. Cannot change week to ${data.week_number}`
            );
          }
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
          throw new BadRequestException(`Failed to validate week number: ${error.message}`);
        }
      }

      // Validate quantity if being updated
      if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity < 0)) {
        throw new BadRequestException('Quantity must be a positive number');
      }

      // Determine if pallet operations are needed
      const affectsPallet =
        typeof data.quantity === 'number' ||
        typeof data.item_id === 'string' ||
        typeof (data as any).pallet_code === 'string' ||
        typeof data.uom === 'string';

      let targetPalletId = existing.pallet_id;
      
      // Validate target pallet if pallet_code is provided
      if ((data as any).pallet_code) {
        try {
          const targetPallet = await this.palletService.findByPalletCode((data as any).pallet_code);
          if (!targetPallet) {
            throw new NotFoundException(`Target pallet with code '${(data as any).pallet_code}' not found`);
          }
          targetPalletId = targetPallet.id;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
          throw new BadRequestException(`Failed to validate target pallet: ${error.message}`);
        }
      }

      // Handle pallet quantity updates with proper error handling
      if (affectsPallet) {
        try {
          // Remove from existing pallet
          await this.palletService.updateQuantity(existing.pallet_id, {
            item_id: existing.item_id,
            quantity: existing.quantity,
            production_date: existing.production_date,
            operation_type: QuantityOperationType.REMOVE,
            inbound_id: existing.inbound_id,
            reference_id: id,
            reference_type: 'INBOUND_SCAN_UPDATE',
            notes: 'revert previous',
            user_id: data.user_id || existing.user_id,
            uom: existing.uom,
            week_number: existing.week_number,
          });

          // Add to target pallet
          await this.palletService.updateQuantity(targetPalletId, {
            item_id: data.item_id ?? existing.item_id,
            quantity: typeof data.quantity === 'number' ? data.quantity : existing.quantity,
            production_date: data.production_date ?? existing.production_date,
            operation_type: QuantityOperationType.ADD,
            inbound_id: existing.inbound_id,
            reference_id: id,
            reference_type: 'INBOUND_SCAN_UPDATE',
            notes: data.user_name ?? existing.user_name,
            user_id: data.user_id ?? existing.user_id,
            uom: data.uom ?? existing.uom,
            week_number: data.week_number ?? existing.week_number,
          });
        } catch (error) {
          throw new BadRequestException(`Failed to update pallet quantities: ${error.message}`);
        }
      }

      // Prepare update payload
      const payload: any = { ...data };
      if (targetPalletId && targetPalletId !== existing.pallet_id) {
        payload.pallet_id = targetPalletId;
      }

      // Update the transaction with error handling
      try {
        const updatedTransaction = await this.repository.update(id, payload);
        if (!updatedTransaction) {
          throw new BadRequestException('Failed to update transaction scan inbound');
        }
        return updatedTransaction;
      } catch (error) {
        throw new BadRequestException(`Database update failed: ${error.message}`);
      }

    } catch (error) {
      // Log error for debugging
      console.error(`Error updating transaction scan inbound ${id}:`, error);
      
      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new BadRequestException(`Update operation failed: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    
    await this.palletService.updateQuantity(existing.pallet_id, {
      item_id: existing.item_id,
      quantity: existing.quantity,
      production_date: existing.production_date,
      operation_type: QuantityOperationType.REMOVE,
      inbound_id: existing.inbound_id,
      reference_id: id,
      reference_type: 'INBOUND_SCAN_DELETE',
      notes: 'Transaction scan inbound deleted',
      user_id: existing.user_id,
      uom: existing.uom,
      week_number: existing.week_number,
    });
    
    await this.repository.remove(id);
  }

  async updateManyStatusTo(dto: UpdateManyStatusToDto, status: ScanInboundStatus, inspection_by: string): Promise<UpdateResult> {
    if (status === ScanInboundStatus.COMPLETED) {
      for (const id of dto.ids) {
        const existing = await this.findOne(id);
        if (!existing) throw new NotFoundException('Transaction scan inbound not found');
        const warehouseSub = await this.warehouseSubService.findOne(existing.m_warehouse_sub_id);
        if (!warehouseSub) throw new NotFoundException('Warehouse sub not found');
        
        // createOrUpdateInventoryTracking now automatically detects location changes
        await this.inventoryTrackingService.createOrUpdateInventoryTracking(
          existing.pallet_id, 
          existing.m_warehouse_sub_id, 
          warehouseSub.warehouse_id, 
          'INSPECTION_COMPLETED', 
          existing.inbound_id
        );
      }
    }
    return this.repository.updateManyStatusTo(dto, status, inspection_by);
  }

  async updateChangePallet(id: string, data: CreateTransactionScanInboundDto): Promise<TransactionScanInbound> {
    // Validasi week_number untuk pallet baru sebelum menghapus yang lama
    if (data.pallet_code) {
      const newPallet = await this.palletService.findByPalletCode(data.pallet_code);
      if (newPallet) {
        const existingItemsInNewPallet = await this.repository.findItemsInPalletWithDifferentWeek(newPallet.id, data.week_number);
        const differentWeekItems = existingItemsInNewPallet.filter(item => item.week_number !== data.week_number);
        if (differentWeekItems.length > 0) {
          throw new BadRequestException(`Pallet baru sudah berisi item dengan week ${differentWeekItems[0].week_number}. Tidak dapat memindahkan item dengan week ${data.week_number}`);
        }
      }
    }
    
    this.remove(id);
    return this.create(data as CreateTransactionScanInboundDto);
  }
}


