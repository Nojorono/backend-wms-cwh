import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Approval, ApprovalStatus, EntityType } from '../core/domain/entities/approval.entity';
import { ApprovalLevel } from '../core/domain/entities/approval-level.entity';
import { ApprovalRepository } from './repositories/approval.repository';
import { ApprovalSetupService } from '../approval-setup/approval-setup.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ApproveRequestDto, RejectRequestDto } from './dto/approve-request.dto';
import { ApprovalPaginationDto } from './dto/approval-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ApprovalService {
  constructor(
    private readonly repository: ApprovalRepository,
    private readonly approvalSetupService: ApprovalSetupService,
    private readonly paginationService: PaginationService,
    private readonly dataSource: DataSource,
    @InjectRepository(ApprovalLevel)
    private readonly approvalLevelRepository: Repository<ApprovalLevel>,
    private readonly moduleRef: ModuleRef,
  ) {}

  private buildFilters(query: ApprovalPaginationDto) {
    return {
      status: query.status,
      entity_type: query.entity_type,
      entity_id: query.entity_id,
      search: query.search,
    };
  }

  async create(payload: CreateApprovalDto): Promise<Approval> {
    // Check if there's already a pending approval for this entity
    const existing = await this.repository.findByEntity(payload.entity_type, payload.entity_id);
    if (existing) {
      throw new BadRequestException(
        'There is already a pending approval request for this entity. Please wait for approval or cancel the existing request.',
      );
    }

    // Get or use provided approval setup
    let approvalSetup;
    if (payload.approval_setup_id) {
      approvalSetup = await this.approvalSetupService.findOne(payload.approval_setup_id);
    } else {
      approvalSetup = await this.approvalSetupService.findByEntityType(payload.entity_type, true);
      if (!approvalSetup) {
        throw new NotFoundException(
          `No active approval setup found for entity type ${payload.entity_type}. Please create an approval setup first.`,
        );
      }
    }

    if (!approvalSetup.is_active) {
      throw new BadRequestException('The selected approval setup is not active');
    }

    // Get first level
    const firstLevel = approvalSetup.approval_levels
      .sort((a, b) => a.level - b.level)[0];

    if (!firstLevel) {
      throw new BadRequestException('Approval setup has no levels configured');
    }

    const approval = await this.repository.create({
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      entity_data: payload.entity_data,
      approval_setup_id: approvalSetup.id,
      status: ApprovalStatus.PENDING,
      current_level: firstLevel.level,
      requested_by: payload.requested_by,
      reason: payload.reason,
      notes: payload.notes,
      approval_history: [],
    });

    const created = await this.repository.findOne(approval.id);
    if (!created) {
      throw new NotFoundException('Failed to reload created approval');
    }
    return created;
  }

  async findAll(query: ApprovalPaginationDto): Promise<Approval[]> {
    return await this.repository.findAll(this.buildFilters(query));
  }

  async findAllPaginated(
    query: ApprovalPaginationDto,
  ): Promise<PaginatedResponseDto<Approval>> {
    const { data, total } = await this.repository.findAllPaginated(
      this.buildFilters(query),
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );

    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<Approval> {
    const approval = await this.repository.findOne(id);
    if (!approval) {
      throw new NotFoundException('Approval not found');
    }
    return approval;
  }

  async approve(id: string, payload: ApproveRequestDto): Promise<Approval> {
    const approval = await this.findOne(id);

    if (approval.status !== ApprovalStatus.PENDING && approval.status !== ApprovalStatus.PARTIALLY_APPROVED) {
      throw new BadRequestException(`Cannot approve request with status ${approval.status}`);
    }

    return await this.dataSource.transaction(async (manager) => {
      const setup = approval.approval_setup;
      const currentLevel = setup.approval_levels.find((l) => l.level === approval.current_level);

      if (!currentLevel) {
        throw new NotFoundException(`Approval level ${approval.current_level} not found in setup`);
      }

      // Add to approval history
      const history = approval.approval_history || [];
      history.push({
        level: currentLevel.level,
        level_name: currentLevel.level_name,
        approved_by: payload.approved_by || 'system',
        approved_at: new Date(),
        comments: payload.comments,
      });

      // Check if current level requirements are met
      const levelApprovals = history.filter((h) => h.level === currentLevel.level);
      const requiredApprovers = currentLevel.required_approvers || 1;

      if (levelApprovals.length < requiredApprovers) {
        // Still need more approvers at this level
        await this.repository.update(id, {
          approval_history: history,
          status: ApprovalStatus.PARTIALLY_APPROVED,
        });
      } else {
        // Current level is complete, move to next level or complete
        const sortedLevels = setup.approval_levels.sort((a, b) => a.level - b.level);
        const currentLevelIndex = sortedLevels.findIndex((l) => l.level === approval.current_level);
        const nextLevel = sortedLevels[currentLevelIndex + 1];

        if (nextLevel) {
          // Move to next level
          await this.repository.update(id, {
            approval_history: history,
            current_level: nextLevel.level,
            status: ApprovalStatus.PENDING,
          });
        } else {
          // All levels approved
          await this.repository.update(id, {
            approval_history: history,
            status: ApprovalStatus.APPROVED,
          });
        }
      }

      const updated = await this.repository.findOne(id);
      if (!updated) {
        throw new NotFoundException('Failed to reload approved request');
      }

      return updated;
    }).then(async (updated) => {
      // If approval is fully approved, trigger entity-specific actions
      // This runs after the transaction commits
      if (updated.status === ApprovalStatus.APPROVED) {
        try {
          await this.handleEntityApproval(updated);
        } catch (error) {
          console.error('Error in handleEntityApproval:', error);
          // Don't throw - approval is already marked as approved
        }
      }
      return updated;
    });
  }

  async reject(id: string, payload: RejectRequestDto): Promise<Approval> {
    const approval = await this.findOne(id);

    if (approval.status !== ApprovalStatus.PENDING && approval.status !== ApprovalStatus.PARTIALLY_APPROVED) {
      throw new BadRequestException(`Cannot reject request with status ${approval.status}`);
    }

    await this.repository.update(id, {
      status: ApprovalStatus.REJECTED,
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

  async cancel(id: string, cancelledBy?: string, reason?: string): Promise<Approval> {
    const approval = await this.findOne(id);

    if (approval.status !== ApprovalStatus.PENDING && approval.status !== ApprovalStatus.PARTIALLY_APPROVED) {
      throw new BadRequestException(`Cannot cancel request with status ${approval.status}`);
    }

    await this.repository.update(id, {
      status: ApprovalStatus.CANCELLED,
      cancelled_by: cancelledBy,
      cancelled_at: new Date(),
      cancellation_reason: reason,
    });

    const cancelled = await this.repository.findOne(id);
    if (!cancelled) {
      throw new NotFoundException('Failed to reload cancelled request');
    }
    return cancelled;
  }

  async remove(id: string): Promise<void> {
    const approval = await this.findOne(id);

    if (approval.status === ApprovalStatus.APPROVED) {
      throw new BadRequestException('Cannot delete an approved request');
    }

    await this.repository.remove(id);
  }

  private async handleEntityApproval(approval: Approval): Promise<void> {
    // Validate that all required approvals are complete before executing
    const isValid = await this.validateAllApprovalsComplete(approval);
    
    if (!isValid) {
      console.warn(`Approval ${approval.id} is marked as APPROVED but validation failed. Skipping entity execution.`);
      return;
    }

    // This method triggers entity-specific actions when approval is fully approved
    // This allows the approval system to be flexible and trigger different actions based on entity type
    
    switch (approval.entity_type) {
      case EntityType.STOCK_ADJUSTMENT:
        // Execute stock adjustment when fully approved
        await this.executeStockAdjustment(approval);
        break;
      case EntityType.MOVE_ORDER:
        // Could trigger move order execution
        break;
      default:
        // Custom entity types can implement their own handlers
        break;
    }
  }

  private async validateAllApprovalsComplete(approval: Approval): Promise<boolean> {
    try {
      // Reload approval with setup and levels to ensure we have latest data
      const fullApproval = await this.repository.findOne(approval.id);
      if (!fullApproval || !fullApproval.approval_setup) {
        return false;
      }

      const setup = fullApproval.approval_setup;
      const history = fullApproval.approval_history || [];
      const sortedLevels = setup.approval_levels.sort((a, b) => a.level - b.level);

      // Check if require_all_levels is true
      if (setup.require_all_levels) {
        // All levels must be approved
        for (const level of sortedLevels) {
          if (level.is_required && !level.can_skip) {
            const levelApprovals = history.filter((h) => h.level === level.level);
            const requiredApprovers = level.required_approvers || 1;

            if (levelApprovals.length < requiredApprovers) {
              console.warn(
                `Level ${level.level} (${level.level_name}) requires ${requiredApprovers} approver(s), but only ${levelApprovals.length} approval(s) found.`,
              );
              return false;
            }
          }
        }
      } else {
        // At least one level must be approved
        let hasApprovedLevel = false;
        for (const level of sortedLevels) {
          if (level.is_required) {
            const levelApprovals = history.filter((h) => h.level === level.level);
            const requiredApprovers = level.required_approvers || 1;

            if (levelApprovals.length >= requiredApprovers) {
              hasApprovedLevel = true;
              break;
            }
          }
        }

        if (!hasApprovedLevel) {
          console.warn('No required approval level has been completed.');
          return false;
        }
      }

      // Validate that we've reached the end (no more levels)
      const lastLevel = sortedLevels[sortedLevels.length - 1];
      if (fullApproval.current_level !== lastLevel.level) {
        console.warn(
          `Current level (${fullApproval.current_level}) does not match last level (${lastLevel.level}).`,
        );
        return false;
      }

      // Validate that the last level is fully approved
      const lastLevelApprovals = history.filter((h) => h.level === lastLevel.level);
      const lastLevelRequiredApprovers = lastLevel.required_approvers || 1;

      if (lastLevelApprovals.length < lastLevelRequiredApprovers) {
        console.warn(
          `Last level ${lastLevel.level} requires ${lastLevelRequiredApprovers} approver(s), but only ${lastLevelApprovals.length} approval(s) found.`,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating approvals:', error);
      return false;
    }
  }

  private async executeStockAdjustment(approval: Approval): Promise<void> {
    try {
      // Reload approval to ensure we have the latest status
      const latestApproval = await this.repository.findOne(approval.id);
      if (!latestApproval) {
        console.warn(`Approval ${approval.id} not found.`);
        return;
      }

      // Double-check that approval status is APPROVED
      if (latestApproval.status !== ApprovalStatus.APPROVED) {
        console.warn(`Cannot execute stock adjustment: Approval ${latestApproval.id} status is ${latestApproval.status}, not APPROVED.`);
        return;
      }

      // Find stock adjustment approval by entity_id (which is the stock adjustment ID)
      const { StockAdjustmentApproval } = await import('../core/domain/entities/stock-adjustment-approval.entity');
      const stockAdjustmentRepo = this.dataSource.getRepository(StockAdjustmentApproval);
      
      const stockAdjustment = await stockAdjustmentRepo.findOne({
        where: { id: latestApproval.entity_id },
      });

      if (!stockAdjustment) {
        console.warn(`Stock adjustment with ID ${latestApproval.entity_id} not found.`);
        return;
      }

      if (stockAdjustment.approval_id !== latestApproval.id) {
        console.warn(
          `Stock adjustment ${stockAdjustment.id} approval_id (${stockAdjustment.approval_id}) does not match approval ${latestApproval.id}.`,
        );
        return;
      }

      // Get the latest approver from approval history
      const history = latestApproval.approval_history || [];
      const latestApprover = history.length > 0 ? history[history.length - 1].approved_by : undefined;

      // Get StockAdjustmentApprovalService using ModuleRef to avoid circular dependency
      try {
        const { StockAdjustmentApprovalService } = await import('../stock-adjustment-approval/stock-adjustment-approval.service');
        const stockAdjustmentService = this.moduleRef.get(StockAdjustmentApprovalService, { strict: false });
        
        if (stockAdjustmentService) {
          console.log(`Executing stock adjustment ${stockAdjustment.id} after full approval.`);
          await stockAdjustmentService.executeStockAdjustment(
            stockAdjustment.id,
            latestApprover,
          );
          console.log(`Stock adjustment ${stockAdjustment.id} executed successfully.`);
        } else {
          console.warn(`StockAdjustmentApprovalService not available. Stock adjustment ${stockAdjustment.id} should be executed manually.`);
        }
      } catch (serviceError) {
        // Service might not be available due to circular dependency
        // Log but don't fail - approval is already marked as approved
        console.error(`Error getting StockAdjustmentApprovalService: ${serviceError.message}`);
        console.log(`Stock adjustment ${stockAdjustment.id} approved. Execution should be triggered via stock-adjustment-approval endpoint.`);
      }
    } catch (error) {
      console.error('Error executing stock adjustment:', error);
      // Don't throw - approval is already marked as approved
    }
  }
}

