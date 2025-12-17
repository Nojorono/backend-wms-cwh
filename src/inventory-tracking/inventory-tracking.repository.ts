import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryTracking,
  ProgressionStatus,
} from '../core/domain/entities/inventory-tracking.entity';
import {
  InventoryTrackingHistory,
  InventoryTrackingAction,
} from '../core/domain/entities/inventory-tracking-history.entity';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { PalletTransactionHistory } from '../core/domain/entities/transaction-pallet-history.entity';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';

@Injectable()
export class InventoryTrackingRepository {
  constructor(
    @InjectRepository(InventoryTracking)
    private readonly repository: Repository<InventoryTracking>,
    @InjectRepository(InventoryTrackingHistory)
    private readonly historyRepository: Repository<InventoryTrackingHistory>,
    @InjectRepository(MasterPallet)
    private readonly palletRepository: Repository<MasterPallet>,
  ) {}

  async create(dto: CreateInventoryTrackingDto): Promise<InventoryTracking> {
    // Extract inbound_id from dto before creating to avoid saving to non-existent column
    const { inbound_id, ...createData } = dto;

    const entity = this.repository.create(createData);
    const saved = await this.repository.save(entity);

    // Cek apakah sudah ada history dengan pallet_id dan inbound_id yang sama
    if (inbound_id) {
      const existingHistory = await this.historyRepository.findOne({
        where: { pallet_id: saved.pallet_id, inbound_id: inbound_id },
      });

      if (!existingHistory) {
        await this.historyRepository.save(
          this.historyRepository.create({
            inventory_tracking_id: saved.id,
            pallet_id: saved.pallet_id,
            warehouse_id: saved.warehouse_id,
            warehouse_sub_id: saved.warehouse_sub_id,
            warehouse_bin_id: saved.warehouse_bin_id,
            inventory_date: saved.inventory_date,
            inventory_status: saved.inventory_status,
            inventory_note: saved.inventory_note,
            action: InventoryTrackingAction.CREATED,
            inbound_id: inbound_id,
          }),
        );
      }
    }

    return saved;
  }

  async findAll(): Promise<InventoryTracking[]> {
    return await this.repository.find({
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
    });
  }

  async findAllPaginated(
    filters: {
      inventory_status?: string;
      warehouse_id?: string;
      warehouse_sub_id?: string;
      warehouse_bin_id?: string;
      pallet_id?: string;
      progression_status?: string;
      item_id?: string;
    },
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: InventoryTracking[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('inventory');

    // Apply filters
    if (filters.inventory_status) {
      queryBuilder.andWhere('inventory.inventory_status = :inventory_status', {
        inventory_status: filters.inventory_status,
      });
    }

    if (filters.warehouse_id) {
      queryBuilder.andWhere('inventory.warehouse_id = :warehouse_id', {
        warehouse_id: filters.warehouse_id,
      });
    }

    if (filters.warehouse_sub_id) {
      queryBuilder.andWhere('inventory.warehouse_sub_id = :warehouse_sub_id', {
        warehouse_sub_id: filters.warehouse_sub_id,
      });
    }

    if (filters.warehouse_bin_id) {
      queryBuilder.andWhere('inventory.warehouse_bin_id = :warehouse_bin_id', {
        warehouse_bin_id: filters.warehouse_bin_id,
      });
    }

    if (filters.pallet_id) {
      queryBuilder.andWhere('inventory.pallet_id = :pallet_id', {
        pallet_id: filters.pallet_id,
      });
    }

    if (filters.progression_status) {
      queryBuilder.andWhere('inventory.progression_status = :progression_status', {
        progression_status: filters.progression_status,
      });
    }

    // Filter by item_id - need to join with transaction_pallet_history
    if (filters.item_id) {
      queryBuilder
        .leftJoin(
          PalletTransactionHistory,
          'pth',
          'pth.pallet_id = inventory.pallet_id AND pth.new_quantity > 0',
        )
        .andWhere('pth.item_id = :item_id', { item_id: filters.item_id });
    }

    // Apply search
    if (search) {
      queryBuilder.andWhere(
        '(inventory.inventory_note ILIKE :search OR inventory.inventory_status ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Define sortable fields mapping
    const sortableFields: Record<string, string> = {
      createdAt: 'inventory.createdAt',
      updatedAt: 'inventory.updatedAt',
      inventory_date: 'inventory.inventory_date',
      inventory_status: 'inventory.inventory_status',
      progression_status: 'inventory.progression_status',
    };

    const defaultOrderField = 'inventory.createdAt';
    const orderField = sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : defaultOrderField;

    // Apply joins and pagination
    queryBuilder
      .leftJoinAndSelect('inventory.pallet', 'pallet')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('inventory.warehouseBin', 'warehouseBin')
      .orderBy(orderField, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    // Add DISTINCT if filtering by item_id to avoid duplicates
    if (filters.item_id) {
      queryBuilder.distinct(true);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async findAllByWarehouse(
    warehouse_sub_id?: string,
    warehouse_bin_id?: string,
  ): Promise<InventoryTracking[]> {
    const qb = this.repository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.pallet', 'pallet')
      .leftJoinAndSelect('inventory.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory.warehouseSub', 'warehouseSub')
      .leftJoinAndSelect('inventory.warehouseBin', 'warehouseBin');

    if (warehouse_sub_id) {
      qb.andWhere('warehouseSub.id = :warehouse_sub_id', { warehouse_sub_id });
    }

    if (warehouse_bin_id) {
      qb.andWhere('warehouseBin.id = :warehouse_bin_id', { warehouse_bin_id });
    }

    return await qb.getMany();
  }

  async findOne(id: string): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
    });
    return entity ?? null;
  }

  async findOneByParams(
    pallet_id: string,
    warehouse_sub_id: string,
    warehouse_id: string,
  ): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({
      where: {
        pallet_id,
        warehouse_sub_id,
        warehouse_id,
      },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
    });
    return entity ?? null;
  }

  async findOneByPalletId(pallet_id: string): Promise<InventoryTracking | null> {
    const entity = await this.repository.findOne({
      where: { pallet_id },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' },
    });
    return entity ?? null;
  }

  async findAllByPalletId(pallet_id: string, inventory_status?: string): Promise<InventoryTracking[]> {
    const whereCondition: any = { pallet_id };
    if (inventory_status) {
      whereCondition.inventory_status = inventory_status;
    }

    return await this.repository.find({
      where: whereCondition,
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPalletById(pallet_id: string): Promise<MasterPallet | null> {
    const entity = await this.palletRepository.findOne({
      where: { id: pallet_id },
    });
    return entity ?? null;
  }

  async findPalletByCode(pallet_code: string): Promise<MasterPallet | null> {
    const entity = await this.palletRepository.findOne({
      where: { pallet_code },
    });
    return entity ?? null;
  }

  // find one history by pallet id
  async findHistoryByPalletId(pallet_id: string): Promise<InventoryTrackingHistory[] | null> {
    const entity = await this.historyRepository.find({
      where: { pallet_id },
      relations: ['pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' },
    });
    return entity ?? null;
  }

  async update(id: string, dto: UpdateInventoryTrackingDto): Promise<InventoryTracking | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    // Extract inbound_id from dto before updating to avoid updating non-existent column
    const { inbound_id, ...updateData } = dto;

    await this.repository.update(id, updateData as any);
    const updated = await this.findOne(id);

    if (updated) {
      // Cek apakah sudah ada history dengan pallet_id dan inbound_id yang sama
      const existingHistory = await this.historyRepository.findOne({
        where: { pallet_id: updated.pallet_id, inbound_id: inbound_id },
        order: { createdAt: 'DESC' },
      });

      // Cek apakah warehouse_sub_id atau warehouse_bin_id berbeda dengan data sebelumnya
      const isLocationChanged =
        existingHistory &&
        (existingHistory.warehouse_sub_id !== updated.warehouse_sub_id ||
          existingHistory.warehouse_bin_id !== updated.warehouse_bin_id);

      if (existingHistory && !isLocationChanged) {
        // Update existing history jika lokasi tidak berubah
        await this.historyRepository.update(existingHistory.id, {
          inventory_tracking_id: updated.id,
          pallet_id: updated.pallet_id,
          warehouse_id: updated.warehouse_id,
          warehouse_sub_id: updated.warehouse_sub_id,
          warehouse_bin_id: updated.warehouse_bin_id,
          inventory_date: updated.inventory_date,
          inventory_status: updated.inventory_status,
          inventory_note: updated.inventory_note,
          action: InventoryTrackingAction.UPDATED,
          inbound_id: inbound_id,
        });
      } else {
        // Buat history baru jika lokasi berubah atau belum ada history
        await this.historyRepository.save(
          this.historyRepository.create({
            inventory_tracking_id: updated.id,
            pallet_id: updated.pallet_id,
            warehouse_id: updated.warehouse_id,
            warehouse_sub_id: updated.warehouse_sub_id,
            warehouse_bin_id: updated.warehouse_bin_id,
            inventory_date: updated.inventory_date,
            inventory_status: updated.inventory_status,
            inventory_note: updated.inventory_note,
            action: isLocationChanged
              ? InventoryTrackingAction.MOVED
              : InventoryTrackingAction.CREATED,
            inbound_id: inbound_id,
          }),
        );
      }
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateProgressionStatus(
    id: string,
    progression_status: ProgressionStatus,
  ): Promise<InventoryTracking | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      return null;
    }

    await this.repository.update(id, { progression_status });
    return await this.findOne(id);
  }

  // Method untuk mengecek apakah sudah ada history dengan inbound_id yang sama
  async findHistoryByInboundId(inbound_id: string): Promise<InventoryTrackingHistory | null> {
    const history = await this.historyRepository.findOne({
      where: { inbound_id },
    });
    return history ?? null;
  }

  // Method untuk mendapatkan semua history berdasarkan inbound_id
  async findAllHistoryByInboundId(inbound_id: string): Promise<InventoryTrackingHistory[]> {
    return await this.historyRepository.find({
      where: { inbound_id },
      relations: ['inventoryTracking', 'pallet', 'warehouse', 'warehouseSub', 'warehouseBin'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByItemId(item_id: string): Promise<any[]> {
    const query = `
      SELECT 
        it.id as inventory_tracking_id,
        it.pallet_id,
        p.pallet_code,
        it.warehouse_id,
        it.warehouse_sub_id,
        it.warehouse_bin_id,
        it.inventory_date,
        it.inventory_status,
        it.inventory_note,
        pth.week_number,
        pth.production_date,
        pth.item_id,
        pth.new_quantity as quantity,
        pth.uom,
        w.name as warehouse_name,
        ws.name as warehouse_sub_name,
        wb.name as bin_name,
        wb.code as bin_code,
        ROUND((pth.new_quantity::numeric / p.capacity::numeric) * 100, 2) as pallet_utilization
      FROM inventory_tracking it
      LEFT JOIN m_pallet p ON it.pallet_id = p.id
      LEFT JOIN transaction_pallet_history pth ON p.id = pth.pallet_id
      LEFT JOIN m_warehouse w ON it.warehouse_id = w.id
      LEFT JOIN m_warehouse_sub ws ON it.warehouse_sub_id = ws.id
      LEFT JOIN m_warehouse_bin wb ON it.warehouse_bin_id = wb.id
      WHERE pth.item_id = $1
        
        AND pth.new_quantity > 0
      ORDER BY it.inventory_date ASC, pth.production_date ASC
    `;

    const results = (await this.repository.query(query, [item_id])) as any[];
    return results;
  }
}
