import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { PalletUpdate, PalletUpdateStatus, PalletUpdateType } from '../core/domain/entities/pallet-update.entity';
import { PalletUpdateScan } from '../core/domain/entities/pallet-update-scan.entity';
import { PalletUpdateItem } from '../core/domain/entities/pallet-update-item.entity';
import { CreatePalletUpdateDto } from './dto/create-pallet-update.dto';
import { CreatePalletUpdateScanDto } from './dto/create-pallet-update-scan.dto';
import { UpdatePalletUpdateScanDto } from './dto/update-pallet-update-scan.dto';

@Injectable()
export class PalletUpdateRepository {
  constructor(
    @InjectRepository(PalletUpdate)
    private readonly repository: Repository<PalletUpdate>,
    @InjectRepository(PalletUpdateScan)
    private readonly scanRepository: Repository<PalletUpdateScan>,
    @InjectRepository(PalletUpdateItem)
    private readonly itemRepository: Repository<PalletUpdateItem>,
  ) { }

  async create(createPalletUpdateDto: CreatePalletUpdateDto): Promise<PalletUpdate> {
    const palletUpdate = this.repository.create(createPalletUpdateDto);
    return await this.repository.save(palletUpdate);
  }

  async findAll(updateType?: PalletUpdateType): Promise<PalletUpdate[]> {
    const where: FindOptionsWhere<PalletUpdate> = {};
    if (updateType) {
      where.updateType = updateType;
    }
    return await this.repository.find({
      where,
      relations: [
        'items',
        'items.pallet',
        'items.item',
        'scans',
        'scans.pallet',
        'assigned',
        'initiatedByUser',
        'inspectionByUser',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PalletUpdate | null> {
    return await this.repository.findOne({
      where: { id },
      relations: [
        'items',
        'items.pallet',
        'items.item',
        'scans',
        'scans.pallet',
        'assigned',
        'initiatedByUser',
        'inspectionByUser',
      ],
    });
  }

  async findOneByUpdateNumber(updateNumber: string): Promise<PalletUpdate | null> {
    return await this.repository.findOne({
      where: { updateNumber },
      relations: [
        'items',
        'items.pallet',
        'items.item',
        'scans',
        'scans.pallet',
        'assigned',
        'initiatedByUser',
        'inspectionByUser',
      ],
    });
  }

  async findAllPaginated(
    filters: {
      organizationId: string;
      updateType?: PalletUpdateType;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    },
  ): Promise<{ data: PalletUpdate[]; total: number }> {
    const {
      organizationId,
      updateType,
      status,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const qb = this.repository
      .createQueryBuilder('palletUpdate')
      .leftJoinAndSelect('palletUpdate.items', 'items')
      .leftJoinAndSelect('items.pallet', 'itemsPallet')
      .leftJoinAndSelect('items.item', 'itemsItem')
      .leftJoinAndSelect('palletUpdate.scans', 'scans')
      .leftJoinAndSelect('scans.pallet', 'scansPallet')
      .leftJoinAndSelect('palletUpdate.assigned', 'assigned')
      .leftJoinAndSelect('palletUpdate.initiatedByUser', 'initiatedByUser')
      .leftJoinAndSelect('palletUpdate.inspectionByUser', 'inspectionByUser');

    qb.andWhere('palletUpdate.organization_id = :organizationId::uuid', { organizationId });

    if (updateType) {
      qb.andWhere('palletUpdate.updateType = :updateType', { updateType });
    }

    if (status) {
      qb.andWhere('palletUpdate.status = :status', { status });
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(palletUpdate.updateNumber) LIKE :search OR
          LOWER(palletUpdate.productionCode) LIKE :search OR
          LOWER(palletUpdate.uom) LIKE :search OR
          LOWER(palletUpdate.notes) LIKE :search
        )`,
        { search: searchTerm },
      );
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'palletUpdate.createdAt',
      updatedAt: 'palletUpdate.updatedAt',
      updateNumber: 'palletUpdate.updateNumber',
      status: 'palletUpdate.status',
      updateType: 'palletUpdate.updateType',
    };

    const orderField = sortableFields[sortBy] || 'palletUpdate.createdAt';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(orderField, orderDirection);

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Generate unique update number based on updateType
   * Format: {PREFIX}-{YEAR}-{SEQUENCE}
   * - UPDATE_PROD_CODE_UOM: IPU-YYYY-XXXX
   * - SPLIT_PALLET: SPU-YYYY-XXXX
   * - MERGE_PALLET: MPU-YYYY-XXXX
   */
  async getNextUpdateNumber(updateType: PalletUpdateType, year?: number): Promise<string> {
    const currentYear = year || new Date().getFullYear();
    const yearStr = currentYear.toString();

    // Map updateType to prefix
    const prefixMap: Record<PalletUpdateType, string> = {
      [PalletUpdateType.UPDATE_PROD_CODE_UOM]: 'IPU',
      [PalletUpdateType.SPLIT_PALLET]: 'SPU',
      [PalletUpdateType.MERGE_PALLET]: 'MPU',
    };

    const prefix = prefixMap[updateType];
    const searchPrefix = `${prefix}-${yearStr}-`;

    // Find the latest update number for this type and year.
    // Use withDeleted() because update_number has a DB unique constraint and cannot be reused even if soft-deleted.
    const row = await this.repository
      .createQueryBuilder('palletUpdate')
      .withDeleted()
      .select('palletUpdate.updateNumber', 'num')
      .where('palletUpdate.updateType = :updateType', { updateType })
      .andWhere('palletUpdate.updateNumber LIKE :prefix', { prefix: `${searchPrefix}%` })
      .orderBy('palletUpdate.updateNumber', 'DESC')
      .limit(1)
      .getRawOne<{ num?: string }>();

    let seq = 1;
    if (row?.num && row.num.startsWith(searchPrefix)) {
      const tail = row.num.substring(searchPrefix.length);
      const parsed = parseInt(tail, 10);
      if (!Number.isNaN(parsed)) {
        seq = parsed + 1;
      }
    }

    return `${searchPrefix}${seq.toString().padStart(4, '0')}`;
  }

  // PalletUpdateScan methods
  async createScan(createScanDto: CreatePalletUpdateScanDto): Promise<PalletUpdateScan> {
    const scan = this.scanRepository.create({
      ...createScanDto,
      scanDate: createScanDto.scanDate ? new Date(createScanDto.scanDate) : undefined,
      productionDate: createScanDto.productionDate ? new Date(createScanDto.productionDate) : undefined,
    });
    return await this.scanRepository.save(scan);
  }

  async findByPalletIdScan(palletId: string): Promise<PalletUpdateScan[]> {
    const pendingStatuses = [
      PalletUpdateStatus.PENDING_ASSIGNMENT,
      PalletUpdateStatus.PENDING_HELPER_ACTION,
      PalletUpdateStatus.PENDING_INSPECTION,
    ];

    return await this.scanRepository
      .createQueryBuilder('scan')
      .leftJoinAndSelect('scan.palletUpdate', 'palletUpdate')
      .leftJoinAndSelect('scan.scanByUser', 'scanByUser')
      .leftJoinAndSelect('scan.pallet', 'pallet')
      .leftJoinAndSelect('scan.item', 'item')
      .where('scan.palletId = :palletId', { palletId })
      .andWhere('palletUpdate.status IN (:...statuses)', {
        statuses: pendingStatuses,
      })
      .orderBy('scan.createdAt', 'DESC')
      .getMany();
  }

  async findByPalletIdItem(palletId: string): Promise<PalletUpdateItem[]> {
    const pendingStatuses = [
      PalletUpdateStatus.PENDING_ASSIGNMENT,
      PalletUpdateStatus.PENDING_HELPER_ACTION,
      PalletUpdateStatus.PENDING_INSPECTION,
    ];

    return await this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.palletUpdate', 'palletUpdate')
      .leftJoinAndSelect('item.pallet', 'pallet')
      .leftJoinAndSelect('item.item', 'itemDetail')
      .where('item.palletId = :palletId', { palletId })
      .andWhere('palletUpdate.status IN (:...statuses)', {
        statuses: pendingStatuses,
      })
      .orderBy('item.createdAt', 'DESC')
      .getMany();
  }

  async deletePalletUpdate(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async updateStatus(id: string, patch: Partial<PalletUpdate>): Promise<PalletUpdate> {
    await this.repository.update(id, patch);
    const updated = await this.findOne(id);
    if (!updated) {
      throw new NotFoundException(`Failed to retrieve updated pallet update with ID ${id}`);
    }
    return updated;
  }

  // async findByPalletId(palletId: string): Promise<{
  //   scans: PalletUpdateScan[];
  //   items: PalletUpdateItem[];
  // }> {
  //   const [scans, items] = await Promise.all([
  //     this.findByPalletIdScan(palletId),
  //     this.findByPalletIdItem(palletId),
  //   ]);

  //   return { scans, items };
  // }

  async findAllScans(palletUpdateId?: string): Promise<PalletUpdateScan[]> {
    const where: FindOptionsWhere<PalletUpdateScan> = {};
    if (palletUpdateId) {
      where.palletUpdateId = palletUpdateId;
    }
    return await this.scanRepository.find({
      where,
      relations: ['palletUpdate', 'scanByUser', 'pallet', 'item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneScan(id: string): Promise<PalletUpdateScan | null> {
    return await this.scanRepository.findOne({
      where: { id },
      relations: ['palletUpdate', 'scanByUser', 'pallet', 'item'],
    });
  }

  async updateScan(id: string, updateScanDto: UpdatePalletUpdateScanDto): Promise<PalletUpdateScan> {
    const updateData: Partial<PalletUpdateScan> = {
      ...updateScanDto,
      scanDate: updateScanDto.scanDate ? new Date(updateScanDto.scanDate) : undefined,
      productionDate: updateScanDto.productionDate ? new Date(updateScanDto.productionDate) : undefined,
    };
    await this.scanRepository.update(id, updateData);
    const updated = await this.findOneScan(id);
    if (!updated) {
      throw new NotFoundException(`Failed to retrieve updated scan with ID ${id}`);
    }
    return updated;
  }

  async deleteScan(id: string): Promise<void> {
    await this.scanRepository.softDelete(id);
  }
}
