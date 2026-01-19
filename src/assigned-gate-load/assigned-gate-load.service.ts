import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AssignedGateLoad,
  AssignedGateLoadStatus,
} from '../core/domain/entities/assigned-gate-load.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';
import { AssignedGateLoadRepository } from '../assigned-gate/repositories/assigned-gate-load.repository';
import { CreateAssignedGateLoadDto } from '../assigned-gate/dto/create-assigned-gate-load.dto';
import { UpdateAssignedGateLoadDto } from '../assigned-gate/dto/update-assigned-gate-load.dto';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';
import { QuantityOperationType } from '../core/domain/entities/transaction-pallet-history.entity';

@Injectable()
export class AssignedGateLoadService {
  constructor(
    private readonly repository: AssignedGateLoadRepository,
    private readonly masterPalletService: MasterPalletService,
    private readonly inventoryTrackingService: InventoryTrackingService,
    @InjectRepository(OutboundMemoItem)
    private readonly outboundMemoItemRepository: Repository<OutboundMemoItem>,
  ) { }

  async create(createDto: CreateAssignedGateLoadDto): Promise<AssignedGateLoad> {
    const loadData = {
      ...createDto,
      // Set default values if not provided
      quantity_picked: createDto.quantity_picked ?? 0,
      quantity_loaded: createDto.quantity_loaded ?? 0,
      quantity_unloaded: createDto.quantity_unloaded ?? 0,
      status: createDto.status ?? AssignedGateLoadStatus.PENDING,
    };

    return await this.repository.create(loadData);
  }

  async findAll(): Promise<AssignedGateLoad[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<AssignedGateLoad> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateAssignedGateLoadDto): Promise<AssignedGateLoad> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }

    const updated = await this.repository.update(id, updateDto);
    if (!updated) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.remove(id);
  }

  async findAllByAssignedGate(assignedGateId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.findAllByAssignedGate(assignedGateId);
  }

  async findAllByOutboundMemo(outboundMemoId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.findAllByOutboundMemo(outboundMemoId);
  }

  async findAllByPalletId(palletId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.findAllByPalletId(palletId);
  }

  async updateQuantityLoaded(
    id: string,
    quantityLoaded: number,
  ): Promise<AssignedGateLoad> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }

    if (quantityLoaded < 0) {
      throw new BadRequestException('Quantity loaded cannot be negative');
    }

    if (existing.quantity_picked && quantityLoaded > existing.quantity_picked) {
      throw new BadRequestException(
        'Quantity loaded cannot exceed quantity picked',
      );
    }

    const updated = await this.repository.update(id, { quantity_loaded: quantityLoaded });
    if (!updated) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return updated;
  }

  async updateQuantityUnloaded(
    id: string,
    quantityUnloaded: number,
  ): Promise<AssignedGateLoad> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }

    if (quantityUnloaded < 0) {
      throw new BadRequestException('Quantity unloaded cannot be negative');
    }

    if (existing.quantity_loaded && quantityUnloaded > existing.quantity_loaded) {
      throw new BadRequestException(
        'Quantity unloaded cannot exceed quantity loaded',
      );
    }

    const updated = await this.repository.update(id, { quantity_unloaded: quantityUnloaded });
    if (!updated) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return updated;
  }

  async approve(
    id: string,
    status: AssignedGateLoadStatus.APPROVED,
  ): Promise<AssignedGateLoad> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    if (existing.status !== AssignedGateLoadStatus.PENDING) {
      throw new BadRequestException('AssignedGateLoad is not pending');
    }
    if (!existing.pallet_id || !existing.item_id || !existing.uom) {
      throw new BadRequestException('Pallet ID, Item ID, and UOM are required for approval');
    }

    // Cut quantity from pallet using quantity_loaded
    if (existing.quantity_loaded > 0) {
      await this.masterPalletService.updateQuantity(existing.pallet_id, {
        item_id: existing.item_id,
        quantity: existing.quantity_loaded,
        operation_type: QuantityOperationType.REMOVE,
        uom: existing.uom,
        notes: `Quantity removed due to load approval. Load ID: ${id}`,
      });
    }

    // Update outbound_memo_item quantity_delivered with quantity_loaded
    if (existing.outbound_memo_id && existing.item_id && existing.quantity_loaded > 0) {
      const outboundMemoItem = await this.outboundMemoItemRepository.findOne({
        where: {
          outbound_memo_id: existing.outbound_memo_id,
          item_id: existing.item_id,
        },
      });

      if (outboundMemoItem) {
        // Add quantity_loaded to existing quantity_delivered (or set if null)
        const newQuantityDelivered =
          (outboundMemoItem.quantity_delivered || 0) + existing.quantity_loaded;
        await this.outboundMemoItemRepository.update(outboundMemoItem.id, {
          quantity_delivered: newQuantityDelivered,
        });
      }
    }

    // Check if quantity_picked == quantity_loaded (fully loaded for this item)
    const isFullyLoaded =
      existing.quantity_picked &&
      existing.quantity_loaded &&
      existing.quantity_picked === existing.quantity_loaded;

    if (isFullyLoaded) {
      // After removing quantity, check if pallet has any items with quantity > 0
      const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(
        existing.pallet_id,
      );

      // Filter items with quantity > 0 (after the removal, check all items)
      const itemsWithQuantity = palletItems.filter(
        (item) => item.current_quantity > 0,
      );

      // Only clear pallet if no items have quantity (pallet is completely empty)
      if (itemsWithQuantity.length === 0) {
        // Clear memo_id, current_quantity, current_week_number in pallet
        const pallet = await this.masterPalletService.findOne(existing.pallet_id);
        if (pallet) {
          await this.masterPalletService.update(existing.pallet_id, {
            memo_id: null as any,
            currentQuantity: 0,
            currentWeekNumber: 0,
          });

          // Set inventory tracking location to null with notes "done loaded"
          try {
            const inventoryTracking =
              await this.inventoryTrackingService.findOneByPalletId(existing.pallet_id);
            if (inventoryTracking) {
              await this.inventoryTrackingService.update(inventoryTracking.id, {
                warehouse_sub_id: null as any,
                warehouse_bin_id: null as any,
                inventory_note: 'Done loaded - pallet fully loaded and cleared',
              });
            }
          } catch (error) {
            // If inventory tracking doesn't exist, log but don't fail
            console.warn(
              `Inventory tracking not found for pallet ${existing.pallet_id}:`,
              error,
            );
          }
        }
      }
    }

    const updated = await this.repository.update(id, { status });
    if (!updated) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return updated;
  }
}

