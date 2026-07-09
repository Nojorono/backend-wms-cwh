import { ConflictException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterWarehouseBinRepository } from './master-warehouse-bin.repository';
import { CreateMasterWarehouseBinDto } from './dto/create-master-warehouse-bin.dto';
import { UpdateMasterWarehouseBinDto } from './dto/update-master-warehouse-bin.dto';
import { MasterWarehouseBin } from 'src/core/domain/entities/master-warehouse-bin.entity';
import { MasterWarehouseSub } from 'src/core/domain/entities/master-warehouse-sub.entity';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class MasterWarehouseBinService {
  constructor(
    private readonly repository: MasterWarehouseBinRepository,
    private readonly barcodeService: BarcodeService,
    @InjectRepository(MasterWarehouseSub)
    private readonly warehouseSubRepository: Repository<MasterWarehouseSub>,
  ) { }

  async create(
    createMasterWarehouseBinDto: CreateMasterWarehouseBinDto,
  ): Promise<MasterWarehouseBin> {
    if (createMasterWarehouseBinDto.warehouse_sub_id) {
      await this.ensureWarehouseSubBinCapacity(createMasterWarehouseBinDto.warehouse_sub_id);
    }

    return await this.repository.create(createMasterWarehouseBinDto);
  }

  async findAll(): Promise<MasterWarehouseBin[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterWarehouseBin> {
    const warehouseBin = await this.repository.findOne(id);
    if (!warehouseBin) {
      throw new NotFoundException(`Warehouse Bin with ID ${id} not found`);
    }
    return warehouseBin;
  }

  async findByWarehouseSubId(warehouse_sub_id: string): Promise<MasterWarehouseBin[]> {
    return await this.repository.findByWarehouseSubId(warehouse_sub_id);
  }

  async update(
    id: string,
    updateMasterWarehouseBinDto: UpdateMasterWarehouseBinDto,
  ): Promise<MasterWarehouseBin> {
    const warehouseBin = await this.findOne(id);
    if (!warehouseBin) {
      throw new NotFoundException(`Warehouse Bin with ID ${id} not found`);
    }

    const targetWarehouseSubId =
      updateMasterWarehouseBinDto.warehouse_sub_id ?? warehouseBin.warehouse_sub_id;

    if (
      targetWarehouseSubId &&
      targetWarehouseSubId !== warehouseBin.warehouse_sub_id
    ) {
      await this.ensureWarehouseSubBinCapacity(targetWarehouseSubId, id);
    }

    const updatedWarehouseBin = await this.repository.update(id, updateMasterWarehouseBinDto);
    if (!updatedWarehouseBin) {
      throw new NotFoundException(`Warehouse Bin with ID ${id} not found`);
    }
    return updatedWarehouseBin;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.repository.remove(id);
    } catch (error) {
      // PostgreSQL foreign key violation: record is still referenced by other tables.
      if (error instanceof QueryFailedError && (error as any).driverError?.code === '23503') {
        throw new ConflictException(
          'Warehouse bin cannot be deleted because it is still used by other data.',
        );
      }
      throw error;
    }
  }

  private async ensureWarehouseSubBinCapacity(
    warehouseSubId: string,
    excludeBinId?: string,
  ): Promise<void> {
    const warehouseSub = await this.warehouseSubRepository.findOne({
      where: { id: warehouseSubId },
    });

    if (!warehouseSub) {
      throw new NotFoundException(`Warehouse Sub with ID ${warehouseSubId} not found`);
    }

    if (warehouseSub.capacity_bin == null) {
      return;
    }

    const currentBinCount = await this.repository.countByWarehouseSubId(
      warehouseSubId,
      excludeBinId,
    );

    if (currentBinCount >= warehouseSub.capacity_bin) {
      throw new BadRequestException(
        `Warehouse sub "${warehouseSub.name ?? warehouseSub.code ?? warehouseSubId}" has reached capacity_bin limit (${warehouseSub.capacity_bin})`,
      );
    }
  }

}
