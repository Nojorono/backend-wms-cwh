import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InventoryMovementRepository } from './inventory-movement.repository';
import { CreateInventoryMovementDto, CreateInventoryMovementPalletDto } from './dto/create-inventory-movement.dto';
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
import { InventoryTracking, ProgressionStatus } from 'src/core/domain/entities/inventory-tracking.entity';
import { MovePalletDto } from './dto/move-pallet.dto';

@Injectable()
export class InventoryMovementService {
  constructor(
    private readonly repository: InventoryMovementRepository,
    private readonly inventoryTrackingService: InventoryTrackingService,
    @InjectRepository(InventoryTrackingHistory)
    private readonly historyRepository: Repository<InventoryTrackingHistory>,
    @InjectRepository(InventoryMovementPallet)
    private readonly palletRepository: Repository<InventoryMovementPallet>,
    private readonly paginationService: PaginationService,
  ) { }

  async create(data: CreateInventoryMovementDto): Promise<any> {
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

    for (const pallet of data.pallets) {
      const inventoryTracking = await this.inventoryTrackingService.findOne(pallet.inventory_tracking_id);
      if (!inventoryTracking) {
        throw new BadRequestException('Inventory tracking not found');
      }
      if (inventoryTracking.warehouse_sub_id !== data.source_warehouse_sub_id) {
        throw new BadRequestException('Inventory tracking not found in the source warehouse sub');
      }
      if (inventoryTracking.warehouse_bin_id !== data.source_bin_id) {
        throw new BadRequestException('Inventory tracking not found in the source bin');
      }
    }

    return await this.repository.create(data);
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
          this.palletRepository.save(pallet),
        ),
      );
    }
  }

  async movePalletToDestinationWarehouse(dto: MovePalletDto): Promise<InventoryMovement> {

    const inventoryMovement = await this.repository.findOne(dto.inventory_movement_id);
    if (!inventoryMovement) {
      throw new NotFoundException('Inventory movement not found');
    }
    await this.inventoryTrackingService.update(dto.inventory_tracking_id, {
      warehouse_id: dto.destination_warehouse_id,
      warehouse_sub_id: dto.destination_warehouse_sub_id,
      warehouse_bin_id: dto.destination_bin_id,
      inventory_note: 'Pallet inspected and moved to destination warehouse',
      inventory_date: new Date(),
      inventory_status: 'IN_INVENTORY',
      progression_status: ProgressionStatus.COMPLETED,
    });
    await this.repository.updateStatusPallet(dto.inventory_movement_id, dto.pallet_id, dto.inventory_tracking_id);
    return inventoryMovement;
  }


  async completePallet(dto: MovePalletDto): Promise<InventoryMovement> {
    const inventoryMovement = await this.repository.findOne(dto.inventory_movement_id);
    if (!inventoryMovement) {
      throw new NotFoundException('Inventory movement not found');
    }
    await this.repository.updateStatusPallet(dto.inventory_movement_id, dto.pallet_id, dto.inventory_tracking_id);
    return inventoryMovement;
  }
}

