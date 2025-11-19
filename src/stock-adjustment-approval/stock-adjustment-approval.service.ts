import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StockAdjustmentApproval } from '../core/domain/entities/stock-adjustment-approval.entity';
import { ApprovalStatus, EntityType } from '../core/domain/entities/approval.entity';
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
import { ApprovalService } from '../approval/approval.service';
import { CreateApprovalDto } from '../approval/dto/create-approval.dto';
import { ApproveRequestDto, RejectRequestDto } from '../approval/dto/approve-request.dto';

@Injectable()
export class StockAdjustmentApprovalService {
  constructor(
    private readonly repository: StockAdjustmentApprovalRepository,
    private readonly approvalService: ApprovalService,
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

    return await this.dataSource.transaction(async (manager) => {
      // Create stock adjustment approval record
      const stockAdjustment = await this.repository.create({
        pallet_id: payload.pallet_id,
        item_id: payload.item_id,
        current_quantity: currentItem.current_quantity,
        requested_quantity: payload.requested_quantity,
        uom: payload.uom || currentItem.uom,
        production_date: payload.production_date ? new Date(payload.production_date) : currentItem.production_date,
        week_number: payload.week_number || currentItem.week_number,
        target_pallet_id: payload.target_pallet_id,
      });

      // Create approval request using flexible approval system
      const approvalDto: CreateApprovalDto = {
        entity_type: EntityType.STOCK_ADJUSTMENT,
        entity_id: stockAdjustment.id,
        entity_data: {
          pallet_id: payload.pallet_id,
          item_id: payload.item_id,
          current_quantity: currentItem.current_quantity,
          requested_quantity: payload.requested_quantity,
          target_pallet_id: payload.target_pallet_id,
        },
        reason: payload.reason,
        notes: payload.notes,
        requested_by: payload.requested_by,
      };

      const approval = await this.approvalService.create(approvalDto);

      // Link approval to stock adjustment
      await this.repository.update(stockAdjustment.id, { approval_id: approval.id });

      const created = await this.repository.findOne(stockAdjustment.id);
      if (!created) {
        throw new NotFoundException('Failed to reload created approval request');
      }
      return created;
    });
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

    if (!existing.approval) {
      throw new NotFoundException('Approval record not found for this stock adjustment');
    }

    if (existing.approval.status !== ApprovalStatus.PENDING && existing.approval.status !== ApprovalStatus.PARTIALLY_APPROVED) {
      throw new BadRequestException('Only pending or partially approved requests can be updated');
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

    // Note: reason and notes are stored in Approval entity, not StockAdjustmentApproval
    // If needed, we could update the approval record here, but for now we'll just update stock adjustment fields

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

    if (existing.approval && existing.approval.status === ApprovalStatus.APPROVED) {
      throw new BadRequestException('Cannot delete an approved request');
    }

    // Remove approval if exists
    if (existing.approval_id) {
      await this.approvalService.remove(existing.approval_id);
    }

    await this.repository.remove(id);
  }

  async approve(id: string, payload: ApproveStockAdjustmentDto): Promise<StockAdjustmentApproval> {
    const stockAdjustment = await this.findOne(id);

    if (!stockAdjustment.approval_id) {
      throw new NotFoundException('Approval record not found for this stock adjustment');
    }

    // Use ApprovalService to approve
    const approveDto: ApproveRequestDto = {
      approved_by: payload.approved_by,
      comments: payload.notes,
    };

    const approval = await this.approvalService.approve(stockAdjustment.approval_id, approveDto);

    // If fully approved, execute the stock adjustment
    if (approval.status === ApprovalStatus.APPROVED) {
      await this.executeStockAdjustment(id, payload.approved_by);
    }

    return await this.findOne(id);
  }

  async executeStockAdjustment(id: string, userId?: string): Promise<void> {
    const stockAdjustment = await this.findOne(id);

    // Validate that approval is fully approved before executing
    if (!stockAdjustment.approval_id) {
      throw new BadRequestException('Stock adjustment approval does not have an associated approval record.');
    }

    const approval = await this.approvalService.findOne(stockAdjustment.approval_id);

    if (approval.status !== ApprovalStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot execute stock adjustment: Approval status is ${approval.status}, not APPROVED. Please ensure all required approval levels are completed.`,
      );
    }

    // Additional validation: Check that all required approvals are complete
    // This is a safety check in case the approval was manually set to APPROVED
    const history = approval.approval_history || [];
    const setup = approval.approval_setup;

    if (setup) {
      const sortedLevels = setup.approval_levels.sort((a, b) => a.level - b.level);
      const lastLevel = sortedLevels[sortedLevels.length - 1];

      // Check if we're at the last level
      if (approval.current_level !== lastLevel.level) {
        throw new BadRequestException(
          `Cannot execute: Approval is at level ${approval.current_level}, but last level is ${lastLevel.level}.`,
        );
      }

      // Check if last level has required approvers
      const lastLevelApprovals = history.filter((h) => h.level === lastLevel.level);
      const lastLevelRequiredApprovers = lastLevel.required_approvers || 1;

      if (lastLevelApprovals.length < lastLevelRequiredApprovers) {
        throw new BadRequestException(
          `Cannot execute: Last level requires ${lastLevelRequiredApprovers} approver(s), but only ${lastLevelApprovals.length} approval(s) found.`,
        );
      }

      // If require_all_levels is true, check all levels
      if (setup.require_all_levels) {
        for (const level of sortedLevels) {
          if (level.is_required && !level.can_skip) {
            const levelApprovals = history.filter((h) => h.level === level.level);
            const requiredApprovers = level.required_approvers || 1;

            if (levelApprovals.length < requiredApprovers) {
              throw new BadRequestException(
                `Cannot execute: Level ${level.level} (${level.level_name}) requires ${requiredApprovers} approver(s), but only ${levelApprovals.length} approval(s) found.`,
              );
            }
          }
        }
      }
    }

    // Get pallet codes for the service calls
    const sourcePallet = await this.masterPalletService.findOne(stockAdjustment.pallet_id);
    
    // Calculate quantity difference
    const quantityDifference = stockAdjustment.current_quantity - stockAdjustment.requested_quantity;

    // Perform the actual stock adjustment on source pallet
    const sourceUpdateDto: UpdatePalletQuantityDto = {
      item_id: stockAdjustment.item_id,
      quantity: stockAdjustment.requested_quantity,
      operation_type: QuantityOperationType.ADJUST,
      uom: stockAdjustment.uom,
      production_date: stockAdjustment.production_date,
      week_number: stockAdjustment.week_number,
      notes: `Stock adjustment approved${stockAdjustment.target_pallet_id ? ` (moved ${quantityDifference} to target pallet)` : ''}`,
      user_id: userId,
      reference_type: 'STOCK_ADJUSTMENT_APPROVAL',
      reference_id: stockAdjustment.id,
      inbound_id: undefined,
      outbound_do_id: undefined,
    };

    await this.masterPalletService.updateQuantityByPalletCode(sourcePallet.pallet_code, sourceUpdateDto);

    // If target pallet is provided, move the excess quantity to it
    if (stockAdjustment.target_pallet_id && quantityDifference > 0) {
      const targetPallet = await this.masterPalletService.findOne(stockAdjustment.target_pallet_id);
      
      // Get source pallet's inventory tracking location
      let sourceTracking;
      try {
        sourceTracking = await this.inventoryTrackingService.findOneByPalletId(stockAdjustment.pallet_id);
      } catch (error) {
        // Source pallet might not have tracking, that's okay
        sourceTracking = null;
      }

      // Ensure target pallet has inventory tracking with same location as source
      if (sourceTracking && sourceTracking.warehouse_sub_id && sourceTracking.warehouse_id) {
        try {
          // Check if target pallet already has inventory tracking
          await this.inventoryTrackingService.findOneByPalletId(stockAdjustment.target_pallet_id);
          // If target already has tracking, we keep it (don't override existing location)
        } catch (error) {
          // Target pallet doesn't have tracking, create one with source location
          try {
            await this.inventoryTrackingService.createOrUpdateInventoryTracking(
              stockAdjustment.target_pallet_id,
              sourceTracking.warehouse_sub_id,
              sourceTracking.warehouse_id,
              sourceTracking.inventory_status || 'IN_INVENTORY',
            );
          } catch (createError) {
            // If creation fails (e.g., duplicate validation), log but continue
            console.warn(
              `Failed to create inventory tracking for target pallet ${stockAdjustment.target_pallet_id}: ${createError.message}`,
            );
          }
        }
      }
      
      const targetUpdateDto: UpdatePalletQuantityDto = {
        item_id: stockAdjustment.item_id,
        quantity: quantityDifference,
        operation_type: QuantityOperationType.ADD,
        uom: stockAdjustment.uom,
        production_date: stockAdjustment.production_date,
        week_number: stockAdjustment.week_number,
        notes: `Quantity moved from pallet ${sourcePallet.pallet_code} via stock adjustment approval`,
        user_id: userId,
        reference_type: 'STOCK_ADJUSTMENT_APPROVAL',
        reference_id: stockAdjustment.id,
        inbound_id: undefined,
        outbound_do_id: undefined,
      };

      await this.masterPalletService.updateQuantityByPalletCode(targetPallet.pallet_code, targetUpdateDto);
    }
  }

  async reject(id: string, payload: RejectStockAdjustmentDto): Promise<StockAdjustmentApproval> {
    const stockAdjustment = await this.findOne(id);

    if (!stockAdjustment.approval_id) {
      throw new NotFoundException('Approval record not found for this stock adjustment');
    }

    // Use ApprovalService to reject
    const rejectDto: RejectRequestDto = {
      rejection_reason: payload.rejection_reason,
      rejected_by: payload.rejected_by,
      notes: payload.notes,
    };

    await this.approvalService.reject(stockAdjustment.approval_id, rejectDto);

    return await this.findOne(id);
  }

  async cancel(id: string, cancelledBy?: string, reason?: string): Promise<StockAdjustmentApproval> {
    const stockAdjustment = await this.findOne(id);

    if (!stockAdjustment.approval_id) {
      throw new NotFoundException('Approval record not found for this stock adjustment');
    }

    // Use ApprovalService to cancel
    await this.approvalService.cancel(stockAdjustment.approval_id, cancelledBy, reason);

    return await this.findOne(id);
  }
}

