import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { PalletUpdate } from '../core/domain/entities/pallet-update.entity';
import { PalletUpdateScan } from '../core/domain/entities/pallet-update-scan.entity';
import { CreatePalletUpdateDto } from './dto/create-pallet-update.dto';
import { CreatePalletUpdateScanDto } from './dto/create-pallet-update-scan.dto';
import { UpdatePalletUpdateScanDto } from './dto/update-pallet-update-scan.dto';
import { PalletUpdateType } from '../core/domain/entities/pallet-update.entity';

@Injectable()
export class PalletUpdateRepository {
  constructor(
    @InjectRepository(PalletUpdate)
    private readonly repository: Repository<PalletUpdate>,
    @InjectRepository(PalletUpdateScan)
    private readonly scanRepository: Repository<PalletUpdateScan>,
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
      relations: ['items', 'scans', 'assigned', 'initiatedByUser', 'inspectionByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PalletUpdate | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['items', 'scans', 'assigned', 'initiatedByUser', 'inspectionByUser'],
    });
  }

  async findOneByUpdateNumber(updateNumber: string): Promise<PalletUpdate | null> {
    return await this.repository.findOne({
      where: { updateNumber },
      relations: ['items', 'scans', 'assigned', 'initiatedByUser', 'inspectionByUser'],
    });
  }

  async findAllPaginated(
    filters: {
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
      .leftJoinAndSelect('palletUpdate.scans', 'scans')
      .leftJoinAndSelect('palletUpdate.assigned', 'assigned')
      .leftJoinAndSelect('palletUpdate.initiatedByUser', 'initiatedByUser')
      .leftJoinAndSelect('palletUpdate.inspectionByUser', 'inspectionByUser');

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

    // Find the latest update number for this type and year
    const row = await this.repository
      .createQueryBuilder('palletUpdate')
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
