import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PutAwayTransaction, Status } from 'src/core/domain/entities/transaction-put-away.entity';
import { CreatePutAwayDto, UpdatePutAwayDto } from './dto/create-put-away.dto';
import { MasterWarehouseBin } from 'src/core/domain/entities/master-warehouse-bin.entity';

@Injectable()
export class PutAwayRepository {
  constructor(
    @InjectRepository(PutAwayTransaction)
    private readonly repository: Repository<PutAwayTransaction>,
  ) {}

  async create(data: CreatePutAwayDto): Promise<PutAwayTransaction> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<PutAwayTransaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('pta')
      .leftJoinAndSelect('pta.inventoryTracking', 'inventoryTracking')
      .leftJoinAndMapOne('pta.destinationBin', MasterWarehouseBin, 'destinationBin', 'destinationBin.id = pta.destination_bin_id')

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<PutAwayTransaction | null> {
    const entity = await this.repository
      .createQueryBuilder('pta')
      .where('pta.id = :id', { id })
      .leftJoinAndSelect('pta.inventoryTracking', 'inventoryTracking')
      .leftJoinAndMapOne('pta.destinationBin', MasterWarehouseBin, 'destinationBin', 'destinationBin.id = pta.destination_bin_id')
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
      .getMany();
    if (!queryBuilder) return [];
    return queryBuilder;
  }

  async findTaskHistoryByDriverId(driver_id: string): Promise<PutAwayTransaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('pta')
      .where('pta.forklift_driver_id = :forklift_driver_id', { forklift_driver_id: driver_id })
      .andWhere('pta.status = :status', { status: Status.COMPLETED })
      .orderBy('pta.created_at', 'DESC')
      .getMany();
    if (!queryBuilder) return [];
    return queryBuilder;
  }
}


