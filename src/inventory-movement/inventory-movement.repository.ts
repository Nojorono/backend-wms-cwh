import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { InventoryMovement } from '../core/domain/entities/inventory-movement.entity';
import { InventoryMovementPallet } from '../core/domain/entities/inventory-movement-pallet.entity';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';

@Injectable()
export class InventoryMovementRepository {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly repository: Repository<InventoryMovement>,
    @InjectRepository(InventoryMovementPallet)
    private readonly palletRepository: Repository<InventoryMovementPallet>,
  ) {}

  async create(data: CreateInventoryMovementDto, pallets: InventoryMovementPallet[]): Promise<InventoryMovement> {
    const entity = this.repository.create({
      source_warehouse_id: data.source_warehouse_id,
      source_warehouse_sub_id: data.source_warehouse_sub_id,
      source_bin_id: data.source_bin_id,
      destination_warehouse_id: data.destination_warehouse_id,
      destination_warehouse_sub_id: data.destination_warehouse_sub_id,
      destination_bin_id: data.destination_bin_id,
      status: data.status,
      assigned_user_id: data.assigned_user_id,
      assigned_user_name: data.assigned_user_name,
      movement_date: data.movement_date ? new Date(data.movement_date) : new Date(),
      notes: data.notes,
      pallets: pallets,
    });
    return this.repository.save(entity);
  }

  async findAll(): Promise<InventoryMovement[]> {
    return this.repository.find({
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

  async findAllPaginated(
    filters: {
      status?: string;
      assigned_user_id?: string;
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

    if (filters.assigned_user_id) {
      queryBuilder.andWhere('movement.assigned_user_id = :assigned_user_id', {
        assigned_user_id: filters.assigned_user_id,
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
            .orWhere('LOWER(movement.assigned_user_name) LIKE :search', {
              search: `%${search.toLowerCase()}%`,
            })
            .orWhere('LOWER(movement.moved_by) LIKE :search', { search: `%${search.toLowerCase()}%` });
        }),
      );
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Define sortable fields mapping
    const sortableFields: Record<string, string> = {
      createdAt: 'movement.createdAt',
      updatedAt: 'movement.updatedAt',
      movement_date: 'movement.movement_date',
      completed_date: 'movement.completed_date',
      status: 'movement.status',
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
    const updateData: any = { ...data };
    if (data.completed_date) {
      updateData.completed_date = new Date(data.completed_date);
    }

    await this.repository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findByAssignedUserId(userId: string): Promise<InventoryMovement[]> {
    return this.repository.find({
      where: { assigned_user_id: userId },
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
}

