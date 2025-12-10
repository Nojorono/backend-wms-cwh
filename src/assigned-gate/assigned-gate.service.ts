import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AssignedGate } from '../core/domain/entities/assigned-gate.entity';
import { AssignedGateUser } from '../core/domain/entities/assigned-gate-user.entity';
import { AssignedGatePallet } from '../core/domain/entities/assigned-gate-pallet.entity';
import { AssignedGateRepository } from './repositories/assigned-gate.repository';
import { AssignedGateUserRepository } from './repositories/assigned-gate-user.repository';
import { AssignedGatePalletRepository } from './repositories/assigned-gate-pallet.repository';
import { CreateAssignedGateDto } from './dto/create-assigned-gate.dto';
import { CreateAssignedGateUserDto } from './dto/create-assigned-gate-user.dto';
import { CreateAssignedGatePalletDto } from './dto/create-assigned-gate-pallet.dto';
import { MasterPalletService } from '../master-pallet/master-pallet.service';
import { InventoryTrackingService } from '../inventory-tracking/inventory-tracking.service';
import { MasterWarehouseSubService } from '../master-warehouse-sub/master-warehouse-sub.service';

@Injectable()
export class AssignedGateService {
  constructor(
    private readonly assignedGateRepo: AssignedGateRepository,
    private readonly assignedGateUserRepo: AssignedGateUserRepository,
    private readonly assignedGatePalletRepo: AssignedGatePalletRepository,
    private readonly masterPalletService: MasterPalletService,
    private readonly inventoryTrackingService: InventoryTrackingService,
    private readonly masterWarehouseSubService: MasterWarehouseSubService,
  ) {}

  // AssignedGate CRUD operations
  async createOrUpdate(createAssignedGateDto: CreateAssignedGateDto): Promise<AssignedGate> {
    const { users, pallets, ...gateData } = createAssignedGateDto;
    let assignedGate: AssignedGate;

    if (createAssignedGateDto.id) {
      // Update existing record
      const { id, ...updateData } = gateData;
      if (!id) {
        throw new BadRequestException('ID is required for update');
      }
      const updated = await this.assignedGateRepo.update(id, updateData);
      if (!updated) {
        throw new NotFoundException('AssignedGate not found');
      }
      assignedGate = updated;

      // Handle users array if provided
      if (users !== undefined) {
        // Get existing users for this gate
        const existingUsers = await this.assignedGateUserRepo.findAllByAssignedGate(assignedGate.id);
        const existingUserIds = existingUsers.map((u) => u.id);
        const newUserIds = users.filter((u) => u.id).map((u) => u.id);

        // Remove users that are not in the new array
        const usersToRemove = existingUserIds.filter((id) => !newUserIds.includes(id));
        for (const userId of usersToRemove) {
          await this.assignedGateUserRepo.remove(userId);
        }

        // Create/update users
        if (users.length > 0) {
          for (const userDto of users) {
            // Set assigned_gate_id to the gate's ID (always use parent gate ID)
            const userData = {
              ...userDto,
              assigned_gate_id: assignedGate.id,
            };

            if (userDto.id) {
              // Update existing user (or create if ID doesn't exist)
              const existing = await this.assignedGateUserRepo.findOne(userDto.id);
              if (existing) {
                await this.assignedGateUserRepo.update(userDto.id, userData);
              } else {
                // ID provided but doesn't exist, create new one
                await this.assignedGateUserRepo.create(userData);
              }
            } else {
              // Create new user
              await this.assignedGateUserRepo.create(userData);
            }
          }
        }
      }

      // Handle pallets array if provided
      if (pallets !== undefined) {
        // Get existing pallets for this gate
        const existingPallets = await this.assignedGatePalletRepo.findAllByAssignedGate(assignedGate.id);
        const existingPalletIds = existingPallets.map((p) => p.id);
        const newPalletIds = pallets.filter((p) => p.id).map((p) => p.id);

        // Remove pallets that are not in the new array
        const palletsToRemove = existingPalletIds.filter((id) => !newPalletIds.includes(id));
        for (const palletId of palletsToRemove) {
          await this.assignedGatePalletRepo.remove(palletId);
        }

        // Create/update pallets
        if (pallets.length > 0) {
          for (const palletDto of pallets) {
            // Set assigned_gate_id to the gate's ID (always use parent gate ID)
            const palletData = {
              ...palletDto,
              assigned_gate_id: assignedGate.id,
            };

            if (palletDto.id) {
              // Update existing pallet (or create if ID doesn't exist)
              const existing = await this.assignedGatePalletRepo.findOne(palletDto.id);
              if (existing) {
                await this.assignedGatePalletRepo.update(palletDto.id, palletData);
              } else {
                // ID provided but doesn't exist, create new one
                await this.assignedGatePalletRepo.create(palletData);
              }
            } else {
              // Create new pallet
              await this.assignedGatePalletRepo.create(palletData);
            }
          }
        }
      }
    } else {
      // Create new record
      assignedGate = await this.assignedGateRepo.create(gateData);

      // Create users if provided
      if (users && users.length > 0) {
        for (const userDto of users) {
          // Always use the parent gate's ID
          await this.assignedGateUserRepo.create({
            ...userDto,
            assigned_gate_id: assignedGate.id,
          });
        }
      }

      // Create pallets if provided
      if (pallets && pallets.length > 0) {
        for (const palletDto of pallets) {
          // Always use the parent gate's ID
          await this.assignedGatePalletRepo.create({
            ...palletDto,
            assigned_gate_id: assignedGate.id,
          });
        }
      }
    }

    // Return gate with users loaded
    const result = await this.assignedGateRepo.findOne(assignedGate.id);
    if (!result) {
      throw new NotFoundException('AssignedGate not found after creation/update');
    }
    return result;
  }

  async findAll(): Promise<AssignedGate[]> {
    const gates = await this.assignedGateRepo.findAll();
    return await this.enrichPalletsWithSkus(gates);
  }

  async findAllByUserId(userId: string): Promise<AssignedGate[]> {
    const gates = await this.assignedGateRepo.findAllByUserId(userId);
    return await this.enrichPalletsWithSkus(gates);
  }

  async findAllByGateId(gateId: string): Promise<AssignedGate[]> {
    const gates = await this.assignedGateRepo.findAllByGateId(gateId);
    return await this.enrichPalletsWithSkus(gates);
  }

  async findAllByOutboundDoId(outboundDoId: string): Promise<AssignedGate[]> {
    const gates = await this.assignedGateRepo.findAllByOutboundDoId(outboundDoId);
    return await this.enrichPalletsWithSkus(gates);
  }

  private async enrichPalletsWithSkus(gates: AssignedGate[]): Promise<AssignedGate[]> {
    for (const gate of gates) {
      if (gate.assigned_gate_pallets && gate.assigned_gate_pallets.length > 0) {
        for (const assignedPallet of gate.assigned_gate_pallets) {
          if (assignedPallet.pallet && assignedPallet.pallet.id) {
            try {
              const palletItems = await this.masterPalletService.getPalletItemLatestQuantity(
                assignedPallet.pallet.id,
              );
              // Add current_skus array to the pallet object
              (assignedPallet.pallet as any).currentItems = palletItems.map((item) => ({
                item_id: item.item_id,
                item_name: item.item_name,
                current_quantity: item.current_quantity,
                uom: item.uom,
                production_date: item.production_date,
                week_number: item.week_number,
              }));
            } catch (error) {
              // If pallet not found or error, set empty array
              (assignedPallet.pallet as any).currentItems = [];
            }
          }
        }
      }
    }
    return gates;
  }

  async findOne(id: string): Promise<AssignedGate> {
    const found = await this.assignedGateRepo.findOne(id);
    if (!found) {
      throw new NotFoundException('AssignedGate not found');
    }
    const enriched = await this.enrichPalletsWithSkus([found]);
    return enriched[0];
  }

  async remove(id: string): Promise<void> {
    await this.assignedGateRepo.remove(id);
  }

  // User management methods by assigned-gate-id
  async addUserToGate(
    assignedGateId: string,
    createUserDto: CreateAssignedGateUserDto,
  ): Promise<AssignedGateUser> {
    // Verify gate exists
    await this.findOne(assignedGateId);

    const userData = {
      ...createUserDto,
      assigned_gate_id: assignedGateId,
    };

    return await this.assignedGateUserRepo.create(userData);
  }

  async updateUserInGate(
    assignedGateId: string,
    userId: string,
    updateUserDto: Partial<CreateAssignedGateUserDto>,
  ): Promise<AssignedGateUser> {
    // Verify gate exists
    await this.findOne(assignedGateId);

    // Verify user exists and belongs to this gate
    const existingUser = await this.assignedGateUserRepo.findOne(userId);
    if (!existingUser) {
      throw new NotFoundException('AssignedGateUser not found');
    }
    if (existingUser.assigned_gate_id !== assignedGateId) {
      throw new BadRequestException('User does not belong to this assigned gate');
    }

    const userData = {
      ...updateUserDto,
      assigned_gate_id: assignedGateId,
    };

    const updated = await this.assignedGateUserRepo.update(userId, userData);
    if (!updated) {
      throw new NotFoundException('AssignedGateUser not found');
    }
    return updated;
  }

  async removeUserFromGate(assignedGateId: string, userId: string): Promise<void> {
    // Verify gate exists
    await this.findOne(assignedGateId);

    // Verify user exists and belongs to this gate
    const existingUser = await this.assignedGateUserRepo.findOne(userId);
    if (!existingUser) {
      throw new NotFoundException('AssignedGateUser not found');
    }
    if (existingUser.assigned_gate_id !== assignedGateId) {
      throw new BadRequestException('User does not belong to this assigned gate');
    }

    await this.assignedGateUserRepo.remove(userId);
  }

  async getUsersByGate(assignedGateId: string): Promise<AssignedGateUser[]> {
    // Verify gate exists
    await this.findOne(assignedGateId);

    return await this.assignedGateUserRepo.findAllByAssignedGate(assignedGateId);
  }

  // Pallet management methods by assigned-gate-id
  async addPalletToGate(
    assignedGateId: string,
    createPalletDto: CreateAssignedGatePalletDto,
  ): Promise<AssignedGatePallet> {
    // Verify gate exists and get gate with relations
    const assignedGate = await this.findOne(assignedGateId);

    if (!assignedGate.gate_id) {
      throw new BadRequestException('Assigned gate must have a gate_id (warehouse sub)');
    }

    // Get the gate (MasterWarehouseSub) to get warehouse_id
    const gate = await this.masterWarehouseSubService.findOne(assignedGate.gate_id);
    if (!gate) {
      throw new NotFoundException('Gate (warehouse sub) not found');
    }

    if (!gate.warehouse_id) {
      throw new BadRequestException('Gate must have a warehouse_id');
    }

    // Create the assigned gate pallet
    const palletData = {
      ...createPalletDto,
      assigned_gate_id: assignedGateId,
    };

    const assignedGatePallet = await this.assignedGatePalletRepo.create(palletData);

    // Move inventory tracking to gate's subwarehouse
    try {
      // Try to find existing inventory tracking for this pallet
      let existingInventory;
      try {
        existingInventory = await this.inventoryTrackingService.findOneByPalletId(createPalletDto.pallet_id);
      } catch (error) {
        // Inventory tracking doesn't exist, will create new one
        existingInventory = null;
      }

      if (existingInventory) {
        // Store previous location before moving (for potential revert)
        const previousLocation = {
          warehouse_sub_id: existingInventory.warehouse_sub_id,
          warehouse_id: existingInventory.warehouse_id,
          warehouse_bin_id: existingInventory.warehouse_bin_id,
          inventory_status: existingInventory.inventory_status,
        };

        // Update existing inventory tracking to move to gate's subwarehouse
        await this.inventoryTrackingService.update(existingInventory.id, {
          warehouse_sub_id: assignedGate.gate_id,
          warehouse_id: gate.warehouse_id,
          warehouse_bin_id: undefined, // Clear bin when moving to gate
          inventory_status: 'IN_GATE',
          inventory_note: `Moved to gate ${gate.name || gate.code} via assigned gate ${assignedGate.id}. Previous location: ${previousLocation.warehouse_sub_id || 'N/A'}`,
          inventory_date: new Date(),
        });
      } else {
        // Create new inventory tracking if it doesn't exist
        await this.inventoryTrackingService.createOrUpdateInventoryTracking(
          createPalletDto.pallet_id,
          assignedGate.gate_id,
          gate.warehouse_id,
          'IN_GATE',
        );
      }
    } catch (error) {
      // Log error but don't fail the pallet creation if inventory tracking fails
      console.error(`Failed to update inventory tracking for pallet ${createPalletDto.pallet_id}:`, error);
    }

    return assignedGatePallet;
  }

  async updatePalletInGate(
    assignedGateId: string,
    palletId: string,
    updatePalletDto: Partial<CreateAssignedGatePalletDto>,
  ): Promise<AssignedGatePallet> {
    // Verify gate exists
    await this.findOne(assignedGateId);

    // Verify pallet exists and belongs to this gate
    const existingPallet = await this.assignedGatePalletRepo.findOne(palletId);
    if (!existingPallet) {
      throw new NotFoundException('AssignedGatePallet not found');
    }
    if (existingPallet.assigned_gate_id !== assignedGateId) {
      throw new BadRequestException('Pallet does not belong to this assigned gate');
    }

    // If pallet_id is being changed, revert inventory for old pallet and move new pallet
    if (updatePalletDto.pallet_id && updatePalletDto.pallet_id !== existingPallet.pallet_id) {
      // Revert inventory for old pallet
      await this.revertInventoryFromGate(existingPallet.pallet_id);

      // Move new pallet to gate
      const assignedGate = await this.findOne(assignedGateId);
      if (assignedGate.gate_id) {
        const gate = await this.masterWarehouseSubService.findOne(assignedGate.gate_id);
        if (gate && gate.warehouse_id) {
          try {
            let existingInventory;
            try {
              existingInventory = await this.inventoryTrackingService.findOneByPalletId(updatePalletDto.pallet_id);
            } catch (error) {
              existingInventory = null;
            }

            if (existingInventory) {
              await this.inventoryTrackingService.update(existingInventory.id, {
                warehouse_sub_id: assignedGate.gate_id,
                warehouse_id: gate.warehouse_id,
                warehouse_bin_id: undefined,
                inventory_status: 'IN_GATE',
                inventory_note: `Moved to gate ${gate.name || gate.code} via assigned gate ${assignedGate.id}`,
                inventory_date: new Date(),
              });
            } else {
              await this.inventoryTrackingService.createOrUpdateInventoryTracking(
                updatePalletDto.pallet_id,
                assignedGate.gate_id,
                gate.warehouse_id,
                'IN_GATE',
              );
            }
          } catch (error) {
            console.error(`Failed to update inventory tracking for pallet ${updatePalletDto.pallet_id}:`, error);
          }
        }
      }
    }

    const palletData = {
      ...updatePalletDto,
      assigned_gate_id: assignedGateId,
    };

    const updated = await this.assignedGatePalletRepo.update(palletId, palletData);
    if (!updated) {
      throw new NotFoundException('AssignedGatePallet not found');
    }
    return updated;
  }

  async removePalletFromGate(assignedGateId: string, palletId: string): Promise<void> {
    // Verify gate exists
    await this.findOne(assignedGateId);

    // Verify pallet exists and belongs to this gate
    const existingPallet = await this.assignedGatePalletRepo.findOne(palletId);
    if (!existingPallet) {
      throw new NotFoundException('AssignedGatePallet not found');
    }
    if (existingPallet.assigned_gate_id !== assignedGateId) {
      throw new BadRequestException('Pallet does not belong to this assigned gate');
    }

    // Revert inventory tracking before removing pallet
    await this.revertInventoryFromGate(existingPallet.pallet_id);

    await this.assignedGatePalletRepo.remove(palletId);
  }

  /**
   * Revert inventory tracking from gate back to previous location
   * Uses inventory tracking history to find the location before it was moved to gate
   */
  private async revertInventoryFromGate(palletId: string): Promise<void> {
    try {
      // Get current inventory tracking
      let currentInventory;
      try {
        currentInventory = await this.inventoryTrackingService.findOneByPalletId(palletId);
      } catch (error) {
        // No inventory tracking found, nothing to revert
        return;
      }

      // Only revert if currently in gate
      if (currentInventory.inventory_status !== 'IN_GATE') {
        return;
      }

      // Get inventory history to find previous location
      let history;
      try {
        history = await this.inventoryTrackingService.findHistoryByPalletId(palletId);
      } catch (error) {
        // No history found, cannot revert
        console.warn(`No inventory history found for pallet ${palletId}, cannot revert location`);
        return;
      }

      // Find the last location before it was moved to gate (IN_GATE status)
      // Look for history entries with status != 'IN_GATE' or before the gate move
      let previousLocation: {
        warehouse_sub_id: string | null;
        warehouse_id: string | null;
        warehouse_bin_id: string | null;
        inventory_status: string | null;
      } | null = null;

      for (const historyEntry of history) {
        if (historyEntry.inventory_status && historyEntry.inventory_status !== 'IN_GATE') {
          previousLocation = {
            warehouse_sub_id: historyEntry.warehouse_sub_id,
            warehouse_id: historyEntry.warehouse_id,
            warehouse_bin_id: historyEntry.warehouse_bin_id,
            inventory_status: historyEntry.inventory_status,
          };
          break; // Use the most recent non-gate location
        }
      }

      // If no previous location found in history, try to get from current inventory note
      // or set to a default location (you may want to adjust this based on your business logic)
      if (!previousLocation) {
        // Check if we can extract previous location from note
        const note = currentInventory.inventory_note || '';
        // If no previous location found, we might want to keep it in gate or set a default
        // For now, we'll set status to indicate it needs manual handling
        console.warn(`No previous location found for pallet ${palletId} in history. Manual handling may be required.`);
        // Optionally, you could set a default location here
        return;
      }

      // Revert to previous location
      await this.inventoryTrackingService.update(currentInventory.id, {
        warehouse_sub_id: previousLocation.warehouse_sub_id || undefined,
        warehouse_id: previousLocation.warehouse_id || undefined,
        warehouse_bin_id: previousLocation.warehouse_bin_id || undefined,
        inventory_status: previousLocation.inventory_status || 'IN_INVENTORY',
        inventory_note: `Reverted from gate. Previous location restored.`,
        inventory_date: new Date(),
      });
    } catch (error) {
      // Log error but don't fail the removal if inventory revert fails
      console.error(`Failed to revert inventory tracking for pallet ${palletId}:`, error);
    }
  }

  async getPalletsByGate(assignedGateId: string): Promise<AssignedGatePallet[]> {
    // Verify gate exists
    await this.findOne(assignedGateId);

    return await this.assignedGatePalletRepo.findAllByAssignedGate(assignedGateId);
  }
}

