import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { InventoryMovement, MovementStatus } from '../core/domain/entities/inventory-movement.entity';
import { InventoryMovementPallet } from '../core/domain/entities/inventory-movement-pallet.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';
import { InventoryMovementUser } from '../core/domain/entities/inventory-movment-user.entity';

@Injectable()
export class InventoryMovementRepository {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly repository: Repository<InventoryMovement>,
    @InjectRepository(InventoryMovementPallet)
    private readonly palletMovementRepository: Repository<InventoryMovementPallet>,
    @InjectRepository(InventoryMovementUser)
    private readonly userRepository: Repository<InventoryMovementUser>,
  ) { }

  async create(data: CreateInventoryMovementDto): Promise<InventoryMovement> {
    const entity = this.repository.create({
      movement_number: data.movement_number,
      movement_type: data.movement_type,
      source_warehouse_id: data.source_warehouse_id,
      source_warehouse_sub_id: data.source_warehouse_sub_id,
      source_bin_id: data.source_bin_id,
      status: data.status,
      notes: data.notes,
      pallets: data.pallets.map((pallet) => {
        return {
          pallet_id: pallet.pallet_id,
          inventory_tracking_id: pallet.inventory_tracking_id,
        };
      }),
      users: data.users && data.users.length > 0 ? data.users.map((user) => {
        return {
          user_id: user.user_id,
          user_name: user.user_name,
          user_phone: user.user_phone,
        };
      }) : undefined,
      destination_warehouse_id: data.destination_warehouse_id,
      destination_warehouse_sub_id: data.destination_warehouse_sub_id,
      destination_bin_id: data.destination_bin_id,
    });
    return this.repository.save(entity);
  }

  async findAll(): Promise<InventoryMovement[]> {
    return this.repository.find({
      relations: [
        'pallets',
        'pallets.pallet',
        'pallets.inventoryTracking',
        'users',
        'users.user',
        'sourceWarehouse',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouse',
        'destinationWarehouseSub',
        'destinationBin',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    filters: {
      status?: string;
      movement_number?: string;
      source_warehouse_id?: string;
      source_warehouse_sub_id?: string;
      destination_warehouse_id?: string;
      destination_warehouse_sub_id?: string;
      pallet_id?: string;
    },
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: InventoryMovement[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.pallets', 'pallets')
      .leftJoinAndSelect('pallets.pallet', 'pallet')
      .leftJoinAndSelect('pallets.inventoryTracking', 'inventoryTracking')
      .leftJoinAndSelect('movement.users', 'users')
      .leftJoinAndSelect('users.user', 'user')
      .leftJoinAndSelect('movement.sourceWarehouse', 'sourceWarehouse')
      .leftJoinAndSelect('movement.sourceWarehouseSub', 'sourceWarehouseSub')
      .leftJoinAndSelect('movement.sourceBin', 'sourceBin')
      .leftJoinAndSelect('movement.destinationWarehouse', 'destinationWarehouse')
      .leftJoinAndSelect('movement.destinationWarehouseSub', 'destinationWarehouseSub')
      .leftJoinAndSelect('movement.destinationBin', 'destinationBin')
      .where('movement.deletedAt IS NULL');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('movement.status = :status', { status: filters.status });
    }

    if (filters.movement_number) {
      queryBuilder.andWhere('movement.movement_number = :movement_number', {
        movement_number: filters.movement_number,
      });
    }

    if (filters.source_warehouse_id) {
      queryBuilder.andWhere('movement.source_warehouse_id = :source_warehouse_id', {
        source_warehouse_id: filters.source_warehouse_id,
      });
    }

    if (filters.source_warehouse_sub_id) {
      queryBuilder.andWhere('movement.source_warehouse_sub_id = :source_warehouse_sub_id', {
        source_warehouse_sub_id: filters.source_warehouse_sub_id,
      });
    }

    if (filters.destination_warehouse_id) {
      queryBuilder.andWhere('movement.destination_warehouse_id = :destination_warehouse_id', {
        destination_warehouse_id: filters.destination_warehouse_id,
      });
    }

    if (filters.destination_warehouse_sub_id) {
      queryBuilder.andWhere('movement.destination_warehouse_sub_id = :destination_warehouse_sub_id', {
        destination_warehouse_sub_id: filters.destination_warehouse_sub_id,
      });
    }

    if (filters.pallet_id) {
      queryBuilder.andWhere('pallets.pallet_id = :pallet_id', {
        pallet_id: filters.pallet_id,
      });
    }

    // Apply search
    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.orWhere('LOWER(movement.notes) LIKE :search', { search: `%${search.toLowerCase()}%` })
            .orWhere('LOWER(movement.movement_number) LIKE :search', {
              search: `%${search.toLowerCase()}%`,
            });
        }),
      );
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Define sortable fields mapping
    const sortableFields: Record<string, string> = {
      createdAt: 'movement.createdAt',
      updatedAt: 'movement.updatedAt',
      completed_date: 'movement.completed_date',
      status: 'movement.status',
      movement_number: 'movement.movement_number',
    };

    const defaultOrderField = 'movement.createdAt';
    const orderField = sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : defaultOrderField;

    // Apply pagination
    const data = await queryBuilder
      .orderBy(orderField, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findOne(id: string): Promise<InventoryMovement | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'pallets',
        'pallets.pallet',
        'pallets.inventoryTracking',
        'users',
        'users.user',
        'sourceWarehouse',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouse',
        'destinationWarehouseSub',
        'destinationBin',
      ],
    });
  }

  async update(id: string, data: UpdateInventoryMovementDto): Promise<InventoryMovement | null> {
    // Exclude one-to-many relationships that cannot be updated directly
    const { pallets, users, moved_by, completed_date, ...updateData } = data;

    const finalUpdateData: any = { ...updateData };
    if (completed_date) {
      finalUpdateData.completed_date = new Date(completed_date);
    }

    // Update the movement entity
    await this.repository.update(id, finalUpdateData);

    // Handle users update separately if provided
    if (users !== undefined) {
      // Delete existing users for this movement
      await this.userRepository.delete({ inventory_movement_id: id });

      // Create new users if array is not empty
      if (users.length > 0) {
        const newUsers = users.map((user) =>
          this.userRepository.create({
            inventory_movement_id: id,
            user_id: user.user_id,
            user_name: user.user_name,
            user_phone: user.user_phone,
          }),
        );
        await this.userRepository.save(newUsers);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findByAssignedUserId(userId: string): Promise<InventoryMovement[]> {
    return this.repository
      .createQueryBuilder('movement')
      .innerJoin('movement.users', 'assignedUser', 'assignedUser.user_id = :userId', { userId })
      .leftJoinAndSelect('movement.pallets', 'pallets')
      .leftJoinAndSelect('pallets.pallet', 'pallet')
      .leftJoinAndSelect('pallets.inventoryTracking', 'inventoryTracking')
      .leftJoinAndSelect('movement.users', 'users')
      .leftJoinAndSelect('users.user', 'user')
      .leftJoinAndSelect('movement.sourceWarehouse', 'sourceWarehouse')
      .leftJoinAndSelect('movement.sourceWarehouseSub', 'sourceWarehouseSub')
      .leftJoinAndSelect('movement.sourceBin', 'sourceBin')
      .leftJoinAndSelect('movement.destinationWarehouse', 'destinationWarehouse')
      .leftJoinAndSelect('movement.destinationWarehouseSub', 'destinationWarehouseSub')
      .leftJoinAndSelect('movement.destinationBin', 'destinationBin')
      .orderBy('movement.createdAt', 'DESC')
      .getMany();
  }

  async findByStatus(status: string): Promise<InventoryMovement[]> {
    return this.repository.find({
      where: { status: status as any },
      relations: [
        'pallets',
        'pallets.pallet',
        'pallets.inventoryTracking',
        'sourceWarehouse',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouse',
        'destinationWarehouseSub',
        'destinationBin',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getNextMovementNumberForDate(date: Date): Promise<string> {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const prefix = `MOV-${y}${m}${d}-`;
    const row = await this.repository
      .createQueryBuilder('movement')
      .select('movement.movement_number', 'num')
      .where('movement.movement_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('movement.movement_number', 'DESC')
      .limit(1)
      .getRawOne<{ num?: string }>();
    let seq = 1;
    if (row?.num && row.num.startsWith(prefix)) {
      const tail = row.num.substring(prefix.length);
      const parsed = parseInt(tail, 10);
      if (!Number.isNaN(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  async findByMovementNumber(movementNumber: string): Promise<InventoryMovement | null> {
    return this.repository.findOne({
      where: { movement_number: movementNumber },
    });
  }

  async updateStatusPallet(inventoryMovementId: string, palletId: string, inventoryTrackingId: string): Promise<void> {
    await this.palletMovementRepository.update(
      {
        inventory_movement_id: inventoryMovementId,
        pallet_id: palletId,
        inventory_tracking_id: inventoryTrackingId,
      },
      {
        completed_at: new Date(),
        is_completed: true,
      },
    );
  }
}

