import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PutAwayTransaction, Status } from 'src/core/domain/entities/transaction-put-away.entity';
import { CreatePutAwayDto, UpdatePutAwayDto } from './dto/create-put-away.dto';
import { MasterWarehouseBin } from 'src/core/domain/entities/master-warehouse-bin.entity';
import { PutAwayPaginationDto } from './dto/put-away-pagination.dto';

@Injectable()
export class PutAwayRepository {
  constructor(
    @InjectRepository(PutAwayTransaction)
    private readonly repository: Repository<PutAwayTransaction>,
  ) { }

  async create(data: CreatePutAwayDto): Promise<PutAwayTransaction> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async createMany(data: CreatePutAwayDto[]): Promise<PutAwayTransaction[]> {
    const entities = this.repository.create(data);
    return await this.repository.save(entities);
  }

  async findAll(organizationId: string): Promise<PutAwayTransaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('pta')
      .where('pta.organization_id = :organizationId', { organizationId })
      .leftJoinAndSelect('pta.inventoryTracking', 'inventoryTracking')
      .leftJoinAndSelect('inventoryTracking.pallet', 'pallet')
      .leftJoinAndSelect('inventoryTracking.warehouseSub', 'warehouseSub')
      .leftJoinAndMapOne(
        'pta.destinationBin',
        MasterWarehouseBin,
        'destinationBin',
        'destinationBin.id = pta.destination_bin_id',
      )
      .leftJoinAndSelect('destinationBin.warehouseSub', 'destinationBinWarehouseSub');

    return await queryBuilder.getMany();
  }

  async findAllPaginated(
    paginationDto: PutAwayPaginationDto,
    organizationId: string | number | null,
  ): Promise<{ data: PutAwayTransaction[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'DESC',
      status,
      forklift_driver_id,
      driver_name,
    } = paginationDto;

    const qb = this.repository
      .createQueryBuilder('pta')
      .where('pta.organization_id = :organizationId', { organizationId })
      .leftJoinAndSelect('pta.inventoryTracking', 'inventoryTracking')
      .leftJoinAndSelect('inventoryTracking.pallet', 'pallet')
      .leftJoinAndSelect('inventoryTracking.warehouseSub', 'warehouseSub')
      .leftJoinAndMapOne(
        'pta.destinationBin',
        MasterWarehouseBin,
        'destinationBin',
        'destinationBin.id = pta.destination_bin_id',
      )
      .leftJoinAndSelect('destinationBin.warehouseSub', 'destinationBinWarehouseSub');

    if (status) {
      qb.andWhere('pta.status = :status', { status });
    }

    if (forklift_driver_id) {
      qb.andWhere('pta.forklift_driver_id = :forklift_driver_id', { forklift_driver_id });
    }

    if (driver_name) {
      qb.andWhere('LOWER(pta.driver_name) LIKE :driverName', {
        driverName: `%${driver_name.toLowerCase()}%`,
      });
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      qb.andWhere(
        `
        (
          LOWER(pta.driver_name) LIKE :search OR
          LOWER(pta.driver_phone) LIKE :search OR
          LOWER(pta.notes) LIKE :search OR
          LOWER(destinationBin.code) LIKE :search OR
          LOWER(destinationBin.name) LIKE :search
        )
      `,
        { search: searchTerm },
      );
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'pta.createdAt',
      updatedAt: 'pta.updatedAt',
      status: 'pta.status',
      driver_name: 'pta.driver_name',
    };

    const defaultOrderField = 'pta.createdAt';
    const orderField =
      sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : defaultOrderField;
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    if (orderField.includes('.')) {
      const [alias, property] = orderField.split('.');
      qb.orderBy(`${alias}.${property}`, orderDirection);
    } else {
      qb.orderBy(orderField, orderDirection);
    }

    const [entities, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: entities, total };
  }

  async findOne(id: string): Promise<PutAwayTransaction | null> {
    const entity = await this.repository
      .createQueryBuilder('pta')
      .where('pta.id = :id', { id })
      .leftJoinAndSelect('pta.inventoryTracking', 'inventoryTracking')
      .leftJoinAndSelect('inventoryTracking.pallet', 'pallet')
      .leftJoinAndSelect('inventoryTracking.warehouseSub', 'warehouseSub')
      .leftJoinAndMapOne(
        'pta.destinationBin',
        MasterWarehouseBin,
        'destinationBin',
        'destinationBin.id = pta.destination_bin_id',
      )
      .leftJoinAndSelect('destinationBin.warehouseSub', 'destinationBinWarehouseSub')
      .getOne();
    if (!entity) return null;
    return entity;
  }

  async update(id: string, data: UpdatePutAwayDto): Promise<PutAwayTransaction> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Put away not found');
    await this.repository.update(id, data);
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException('Put away not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findTaskByDriverId(driver_id: string): Promise<PutAwayTransaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('pta')
      .where('pta.forklift_driver_id = :forklift_driver_id', { forklift_driver_id: driver_id })
      .andWhere('pta.status = :status', { status: Status.PENDING })
      .leftJoinAndSelect('pta.inventoryTracking', 'inventoryTracking')
      .leftJoinAndSelect('inventoryTracking.pallet', 'pallet')
      .leftJoinAndSelect('inventoryTracking.warehouseSub', 'warehouseSub')
      .leftJoinAndMapOne(
        'pta.destinationBin',
        MasterWarehouseBin,
        'destinationBin',
        'destinationBin.id = pta.destination_bin_id',
      )
      .leftJoinAndSelect('destinationBin.warehouseSub', 'destinationBinWarehouseSub')
      .getMany();
    if (!queryBuilder) return [];
    return queryBuilder;
  }

  async findTaskHistoryByDriverId(driver_id: string): Promise<PutAwayTransaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('pta')
      .where('pta.forklift_driver_id = :forklift_driver_id', { forklift_driver_id: driver_id })
      .andWhere('pta.status = :status', { status: Status.COMPLETED })
      .leftJoinAndSelect('pta.inventoryTracking', 'inventoryTracking')
      .leftJoinAndSelect('inventoryTracking.pallet', 'pallet')
      .leftJoinAndSelect('inventoryTracking.warehouseSub', 'warehouseSub')
      .leftJoinAndMapOne(
        'pta.destinationBin',
        MasterWarehouseBin,
        'destinationBin',
        'destinationBin.id = pta.destination_bin_id',
      )
      .leftJoinAndSelect('destinationBin.warehouseSub', 'destinationBinWarehouseSub')
      .orderBy('pta.created_at', 'DESC')
      .getMany();
    if (!queryBuilder) return [];
    return queryBuilder;
  }
}
