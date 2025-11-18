import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockAdjustmentApproval, StockAdjustmentApprovalStatus } from '../core/domain/entities/stock-adjustment-approval.entity';
import { StockAdjustmentApprovalRepository } from './repositories/stock-adjustment-approval.repository';
import { CreateStockAdjustmentApprovalDto } from './dto/create-stock-adjustment-approval.dto';
import { UpdateStockAdjustmentApprovalDto } from './dto/update-stock-adjustment-approval.dto';
import { ApproveStockAdjustmentDto, RejectStockAdjustmentDto } from './dto/approve-stock-adjustment.dto';
import { StockAdjustmentApprovalPaginationDto } from './dto/stock-adjustment-approval-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { UpdatePalletQuantityDto } from '../master-pallet/dto/pallet-quantity.dto';
import { QuantityOperationType } from '../core/domain/entities/transaction-pallet-history.entity';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';

@Injectable()
export class StockAdjustmentApprovalService {
  constructor(
    private readonly repository: StockAdjustmentApprovalRepository,
    private readonly masterPalletService: MasterPalletService,
    private readonly paginationService: PaginationService,
    private readonly dataSource: DataSource,
    private readonly inventoryTrackingService: InventoryTrackingService,
  ) {}

  private buildFilters(query: StockAdjustmentApprovalPaginationDto) {
    return {
      status: query.status,
      pallet_id: query.pallet_id,
      item_id: query.item_id,
      search: query.search,
    };
  }

  async create(payload: CreateStockAdjustmentApprovalDto): Promise<StockAdjustmentApproval> {
    // Get current quantity from pallet
    const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(payload.pallet_id);
    const currentItem = palletItems.find(
      (item) => item.item_id === payload.item_id && (!payload.uom || item.uom === payload.uom),
    );

    if (!currentItem) {
      throw new NotFoundException(
        `Item ${payload.item_id} not found on pallet ${payload.pallet_id} with UOM ${payload.uom || 'any'}`,
      );
    }

    // Check if there's already a pending request for the same pallet/item
    const existingPending = await this.repository.findAll({
      status: StockAdjustmentApprovalStatus.PENDING,
      pallet_id: payload.pallet_id,
      item_id: payload.item_id,
    });

    if (existingPending.length > 0) {
      throw new BadRequestException(
        'There is already a pending approval request for this pallet and item. Please wait for approval or cancel the existing request.',
      );
    }

    // Validate target_pallet_id if provided
    if (payload.target_pallet_id) {
      if (payload.target_pallet_id === payload.pallet_id) {
        throw new BadRequestException('Target pallet must be different from source pallet');
      }

      // Validate that target pallet exists
      await this.masterPalletService.findOne(payload.target_pallet_id);

      // Validate that requested_quantity is less than current_quantity (we're moving excess)
      if (payload.requested_quantity >= currentItem.current_quantity) {
        throw new BadRequestException(
          'When using target_pallet_id, requested_quantity must be less than current_quantity to move excess quantity',
        );
      }
    }

    const approval = await this.repository.create({
      pallet_id: payload.pallet_id,
      item_id: payload.item_id,
      current_quantity: currentItem.current_quantity,
      requested_quantity: payload.requested_quantity,
      uom: payload.uom || currentItem.uom,
      production_date: payload.production_date ? new Date(payload.production_date) : currentItem.production_date,
      week_number: payload.week_number || currentItem.week_number,
      status: StockAdjustmentApprovalStatus.PENDING,
      reason: payload.reason,
      notes: payload.notes,
      requested_by: payload.requested_by,
      target_pallet_id: payload.target_pallet_id,
    });

    const created = await this.repository.findOne(approval.id);
    if (!created) {
      throw new NotFoundException('Failed to reload created approval request');
    }
    return created;
  }

  async findAll(query: StockAdjustmentApprovalPaginationDto): Promise<StockAdjustmentApproval[]> {
    return await this.repository.findAll(this.buildFilters(query));
  }

  async findAllPaginated(
    query: StockAdjustmentApprovalPaginationDto,
  ): Promise<PaginatedResponseDto<StockAdjustmentApproval>> {
    const { data, total } = await this.repository.findAllPaginated(
      this.buildFilters(query),
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );

    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<StockAdjustmentApproval> {
    const approval = await this.repository.findOne(id);
    if (!approval) {
      throw new NotFoundException('Stock adjustment approval not found');
    }
    return approval;
  }

  async update(id: string, payload: UpdateStockAdjustmentApprovalDto): Promise<StockAdjustmentApproval> {
    const existing = await this.findOne(id);

    if (existing.status !== StockAdjustmentApprovalStatus.PENDING) {
      throw new BadRequestException('Only pending approval requests can be updated');
    }

    // Validate target_pallet_id if provided
    if (payload.target_pallet_id !== undefined) {
      if (payload.target_pallet_id === existing.pallet_id) {
        throw new BadRequestException('Target pallet must be different from source pallet');
      }

      if (payload.target_pallet_id) {
        // Validate that target pallet exists
        await this.masterPalletService.findOne(payload.target_pallet_id);

        // Validate that requested_quantity is less than current_quantity (we're moving excess)
        const requestedQty = payload.requested_quantity !== undefined ? payload.requested_quantity : existing.requested_quantity;
        if (requestedQty >= existing.current_quantity) {
          throw new BadRequestException(
            'When using target_pallet_id, requested_quantity must be less than current_quantity to move excess quantity',
          );
        }
      }
    }

    const updateData: Partial<StockAdjustmentApproval> = {};

    if (payload.requested_quantity !== undefined) {
      updateData.requested_quantity = payload.requested_quantity;
    }

    if (payload.reason !== undefined) {
      updateData.reason = payload.reason;
    }

    if (payload.notes !== undefined) {
      updateData.notes = payload.notes;
    }

    if (payload.uom !== undefined) {
      updateData.uom = payload.uom;
    }

    if (payload.production_date !== undefined) {
      updateData.production_date = new Date(payload.production_date);
    }

    if (payload.week_number !== undefined) {
      updateData.week_number = payload.week_number;
    }

    if (payload.target_pallet_id !== undefined) {
      updateData.target_pallet_id = payload.target_pallet_id;
    }

    await this.repository.update(id, updateData);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);

    if (existing.status === StockAdjustmentApprovalStatus.APPROVED) {
      throw new BadRequestException('Cannot delete an approved request');
    }

    await this.repository.remove(id);
  }

  async approve(id: string, payload: ApproveStockAdjustmentDto): Promise<StockAdjustmentApproval> {
    const approval = await this.findOne(id);

    if (approval.status !== StockAdjustmentApprovalStatus.PENDING) {
      throw new BadRequestException(`Cannot approve request with status ${approval.status}`);
    }

    return await this.dataSource.transaction(async (manager) => {
      // Update approval status
      await this.repository.update(id, {
        status: StockAdjustmentApprovalStatus.APPROVED,
        approved_by: payload.approved_by,
        approved_at: new Date(),
        notes: payload.notes || approval.notes,
      });

      // Get pallet codes for the service calls
      const sourcePallet = await this.masterPalletService.findOne(approval.pallet_id);
      
      // Calculate quantity difference
      const quantityDifference = approval.current_quantity - approval.requested_quantity;

      // Perform the actual stock adjustment on source pallet
      const sourceUpdateDto: UpdatePalletQuantityDto = {
        item_id: approval.item_id,
        quantity: approval.requested_quantity,
        operation_type: QuantityOperationType.ADJUST,
        uom: approval.uom,
        production_date: approval.production_date,
        week_number: approval.week_number,
        notes: `Stock adjustment approved: ${approval.reason}${approval.target_pallet_id ? ` (moved ${quantityDifference} to target pallet)` : ''}`,
        user_id: payload.approved_by,
        reference_type: 'STOCK_ADJUSTMENT_APPROVAL',
        reference_id: approval.id,
        inbound_id: undefined,
        outbound_do_id: undefined,
      };

      await this.masterPalletService.updateQuantityByPalletCode(sourcePallet.pallet_code, sourceUpdateDto);

      // If target pallet is provided, move the excess quantity to it
      if (approval.target_pallet_id && quantityDifference > 0) {
        const targetPallet = await this.masterPalletService.findOne(approval.target_pallet_id);
        
        // Get source pallet's inventory tracking location
        let sourceTracking;
        try {
          sourceTracking = await this.inventoryTrackingService.findOneByPalletId(approval.pallet_id);
        } catch (error) {
          // Source pallet might not have tracking, that's okay
          sourceTracking = null;
        }

        // Ensure target pallet has inventory tracking with same location as source
        if (sourceTracking && sourceTracking.warehouse_sub_id && sourceTracking.warehouse_id) {
          let targetTracking;
          try {
            // Check if target pallet already has inventory tracking
            targetTracking = await this.inventoryTrackingService.findOneByPalletId(approval.target_pallet_id);
            // If target already has tracking, we keep it (don't override existing location)
          } catch (error) {
            // Target pallet doesn't have tracking, create one with source location
            try {
              await this.inventoryTrackingService.createOrUpdateInventoryTracking(
                approval.target_pallet_id,
                sourceTracking.warehouse_sub_id,
                sourceTracking.warehouse_id,
                sourceTracking.inventory_status || 'IN_INVENTORY',
              );
            } catch (createError) {
              // If creation fails (e.g., duplicate validation), log but continue
              // The pallet might have tracking at a different location, which is acceptable
              console.warn(
                `Failed to create inventory tracking for target pallet ${approval.target_pallet_id}: ${createError.message}`,
              );
            }
          }
        }
        
        const targetUpdateDto: UpdatePalletQuantityDto = {
          item_id: approval.item_id,
          quantity: quantityDifference,
          operation_type: QuantityOperationType.ADD,
          uom: approval.uom,
          production_date: approval.production_date,
          week_number: approval.week_number,
          notes: `Quantity moved from pallet ${sourcePallet.pallet_code} via stock adjustment approval: ${approval.reason}`,
          user_id: payload.approved_by,
          reference_type: 'STOCK_ADJUSTMENT_APPROVAL',
          reference_id: approval.id,
          inbound_id: undefined,
          outbound_do_id: undefined,
        };

        await this.masterPalletService.updateQuantityByPalletCode(targetPallet.pallet_code, targetUpdateDto);
      }

      const approved = await this.repository.findOne(id);
      if (!approved) {
        throw new NotFoundException('Failed to reload approved request');
      }
      return approved;
    });
  }

  async reject(id: string, payload: RejectStockAdjustmentDto): Promise<StockAdjustmentApproval> {
    const approval = await this.findOne(id);

    if (approval.status !== StockAdjustmentApprovalStatus.PENDING) {
      throw new BadRequestException(`Cannot reject request with status ${approval.status}`);
    }

    await this.repository.update(id, {
      status: StockAdjustmentApprovalStatus.REJECTED,
      rejected_by: payload.rejected_by,
      rejected_at: new Date(),
      rejection_reason: payload.rejection_reason,
      notes: payload.notes || approval.notes,
    });

    const rejected = await this.repository.findOne(id);
    if (!rejected) {
      throw new NotFoundException('Failed to reload rejected request');
    }
    return rejected;
  }

  async cancel(id: string): Promise<StockAdjustmentApproval> {
    const approval = await this.findOne(id);

    if (approval.status !== StockAdjustmentApprovalStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel request with status ${approval.status}`);
    }

    await this.repository.update(id, {
      status: StockAdjustmentApprovalStatus.CANCELLED,
    });

    const cancelled = await this.repository.findOne(id);
    if (!cancelled) {
      throw new NotFoundException('Failed to reload cancelled request');
    }
    return cancelled;
  }
}

