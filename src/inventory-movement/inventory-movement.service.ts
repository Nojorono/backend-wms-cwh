import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InventoryMovementRepository } from './inventory-movement.repository';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';
import { InventoryMovement, MovementStatus } from '../core/domain/entities/inventory-movement.entity';
import { InventoryMovementPallet } from '../core/domain/entities/inventory-movement-pallet.entity';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';
import { InventoryTrackingHistory } from '../core/domain/entities/inventory-tracking-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryTrackingAction } from '../core/domain/entities/inventory-tracking-history.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { InventoryMovementPaginationQueryDto } from './dto/inventory-movement-pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { InventoryMovementUser } from '../core/domain/entities/inventory-movment-user.entity';

@Injectable()
export class InventoryMovementService {
  constructor(
    private readonly repository: InventoryMovementRepository,
    private readonly inventoryTrackingService: InventoryTrackingService,
    @InjectRepository(InventoryTrackingHistory)
    private readonly historyRepository: Repository<InventoryTrackingHistory>,
    private readonly paginationService: PaginationService,
  ) { }

  async create(data: CreateInventoryMovementDto): Promise<InventoryMovement> {
    // Generate movement_number if not provided
    if (!data.movement_number) {
      data.movement_number = await this.repository.getNextMovementNumberForDate(new Date());
    } else {
      // Validate movement_number must be unique if provided
      const existingMovement = await this.repository.findByMovementNumber(data.movement_number);
      if (existingMovement) {
        throw new ConflictException('Movement number already exists');
      }
    }

    // Validate pallets array
    if (!data.pallets || data.pallets.length === 0) {
      throw new BadRequestException('At least one pallet is required');
    }

    // Get inventory tracking for each pallet
    const inventoryTrackings = await Promise.all(
      data.pallets.map(async (palletDto) => {
        // Find inventory tracking by pallet_id
        return await this.inventoryTrackingService.findOneByPalletId(palletDto.pallet_id);
      }),
    );

    // Validate all pallets are in the same source location
    const allSameLocation = inventoryTrackings.every(
      (tracking) =>
        tracking.warehouse_sub_id === data.source_warehouse_sub_id &&
        tracking.warehouse_bin_id === data.source_bin_id &&
        tracking.warehouse_id === data.source_warehouse_id,
    );

    if (!allSameLocation) {
      throw new BadRequestException(
        'All pallets must be in the same source location (warehouse, warehouse_sub, bin)',
      );
    }

    // Check if there's already a pending movement for any of these pallets
    const existingMovements = await this.repository.findByStatus(MovementStatus.PENDING);
    for (const tracking of inventoryTrackings) {
      const existingMovement = existingMovements.find((m) =>
        m.pallets?.some((p) => p.inventory_tracking_id === tracking.id),
      );
      if (existingMovement) {
        throw new ConflictException(
          `There is already a pending movement for pallet ${tracking.pallet_id}`,
        );
      }
    }

    // Create pallet records
    const palletRecords = inventoryTrackings.map((tracking) => {
      const palletRecord = new InventoryMovementPallet();
      palletRecord.pallet_id = tracking.pallet_id;
      palletRecord.inventory_tracking_id = tracking.id;
      palletRecord.is_completed = false;
      return palletRecord;
    });

    // Create user records
    const userRecords = data.users.map((userDto) => {
      const userRecord = new InventoryMovementUser();
      userRecord.user_id = userDto.user_id;
      userRecord.user_name = userDto.user_name;
      userRecord.user_phone = userDto.user_phone;
      return userRecord;
    });

    // Create movement with pallets and users
    const movement = await this.repository.create(data, palletRecords, userRecords);

    return movement;
  }

  async findAll(): Promise<InventoryMovement[]> {
    return this.repository.findAll();
  }

  async findAllPaginated(
    paginationQuery: InventoryMovementPaginationQueryDto,
  ): Promise<PaginatedResponseDto<InventoryMovement>> {
    const filters = {
      status: paginationQuery.status,
      source_warehouse_id: paginationQuery.source_warehouse_id,
      source_warehouse_sub_id: paginationQuery.source_warehouse_sub_id,
      destination_warehouse_id: paginationQuery.destination_warehouse_id,
      destination_warehouse_sub_id: paginationQuery.destination_warehouse_sub_id,
      pallet_id: paginationQuery.pallet_id,
    };

    const { data, total } = await this.repository.findAllPaginated(
      filters,
      paginationQuery.page,
      paginationQuery.limit,
      paginationQuery.search,
      paginationQuery.sortBy,
      paginationQuery.sortOrder,
    );

    return this.paginationService.createPaginatedResponse(data, paginationQuery, total);
  }

  async findOne(id: string): Promise<InventoryMovement> {
    const movement = await this.repository.findOne(id);
    if (!movement) {
      throw new NotFoundException(`Inventory movement with ID ${id} not found`);
    }
    return movement;
  }

  async update(id: string, data: UpdateInventoryMovementDto): Promise<InventoryMovement> {
    const existing = await this.findOne(id);

    // If status is being changed to COMPLETED, update inventory tracking
    if (data.status === MovementStatus.COMPLETED && existing.status !== MovementStatus.COMPLETED) {
      await this.completeMovement(existing, data.moved_by);
    }

    // If status is being changed to CANCELLED
    if (data.status === MovementStatus.CANCELLED && existing.status !== MovementStatus.CANCELLED) {
      // Just update status, don't move inventory
    }

    // If status is being changed to IN_PROGRESS
    if (data.status === MovementStatus.APPROVED && existing.status !== MovementStatus.APPROVED) {
      // Movement started
    }

    const updateData: any = { ...data };
    if (data.status === MovementStatus.COMPLETED && !existing.completed_date) {
      updateData.completed_date = data.completed_date ? new Date(data.completed_date) : new Date();
    }

    const updated = await this.repository.update(id, updateData);

    if (!updated) {
      throw new NotFoundException(`Inventory movement with ID ${id} not found`);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);

    // Don't allow deletion if movement is completed
    if (existing.status === MovementStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete a completed movement');
    }

    await this.repository.remove(id);
  }

  async findByAssignedUserId(userId: string): Promise<InventoryMovement[]> {
    return this.repository.findByAssignedUserId(userId);
  }

  async findByStatus(status: MovementStatus): Promise<InventoryMovement[]> {
    return this.repository.findByStatus(status);
  }

  async assignJob(movementId: string, userId: string, userName: string): Promise<InventoryMovement> {
    const movement = await this.findOne(movementId);

    if (movement.status !== MovementStatus.PENDING) {
      throw new BadRequestException('Can only assign jobs to pending movements');
    }

    const updated = await this.repository.update(movementId, {
      status: MovementStatus.APPROVED,
    });

    if (!updated) {
      throw new NotFoundException(`Inventory movement with ID ${movementId} not found`);
    }

    return this.findOne(movementId);
  }

  async completeMovement(movement: InventoryMovement, movedBy?: string): Promise<void> {
    if (!movement.pallets || movement.pallets.length === 0) {
      throw new BadRequestException('Movement has no pallets to complete');
    }

    // Update inventory tracking location for each pallet
    for (const pallet of movement.pallets) {
      if (!pallet.inventory_tracking_id) {
        continue;
      }

      // Update inventory tracking location
      await this.inventoryTrackingService.update(pallet.inventory_tracking_id, {
        warehouse_id: movement.destination_warehouse_id,
        warehouse_sub_id: movement.destination_warehouse_sub_id,
        warehouse_bin_id: movement.destination_bin_id,
        inventory_note: `Moved from ${movement.source_warehouse_sub_id} to ${movement.destination_warehouse_sub_id}`,
      });

      // Get updated inventory tracking for history
      const updatedTracking = await this.inventoryTrackingService.findOne(
        pallet.inventory_tracking_id,
      );

      // Create history record
      await this.historyRepository.save(
        this.historyRepository.create({
          inventory_tracking_id: pallet.inventory_tracking_id,
          pallet_id: pallet.pallet_id,
          warehouse_id: movement.destination_warehouse_id,
          warehouse_sub_id: movement.destination_warehouse_sub_id,
          warehouse_bin_id: movement.destination_bin_id,
          inventory_date: updatedTracking.inventory_date,
          inventory_status: updatedTracking.inventory_status,
          inventory_note: `Movement completed: ${movement.notes || 'No notes'}`,
          action: InventoryTrackingAction.MOVED,
        }),
      );

      // Mark pallet as completed
      pallet.is_completed = true;
      pallet.completed_at = new Date();
    }

    // Save all pallet updates
    if (movement.pallets && movement.pallets.length > 0) {
      await Promise.all(
        movement.pallets.map((pallet) =>
          this.repository['palletRepository'].save(pallet),
        ),
      );
    }
  }
}

