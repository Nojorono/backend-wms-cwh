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

@Injectable()
export class AssignedGateService {
  constructor(
    private readonly assignedGateRepo: AssignedGateRepository,
    private readonly assignedGateUserRepo: AssignedGateUserRepository,
    private readonly assignedGatePalletRepo: AssignedGatePalletRepository,
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
    return await this.assignedGateRepo.findAll();
  }

  async findAllByUserId(userId: string): Promise<AssignedGate[]> {
    return await this.assignedGateRepo.findAllByUserId(userId);
  }

  async findOne(id: string): Promise<AssignedGate> {
    const found = await this.assignedGateRepo.findOne(id);
    if (!found) {
      throw new NotFoundException('AssignedGate not found');
    }
    return found;
  }

  async remove(id: string): Promise<void> {
    await this.assignedGateRepo.remove(id);
  }
}

