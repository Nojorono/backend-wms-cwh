import { Injectable, NotFoundException } from '@nestjs/common';
import { MasterWarehouseBinRepository } from './master-warehouse-bin.repository';
import { CreateMasterWarehouseBinDto } from './dto/create-master-warehouse-bin.dto';
import { UpdateMasterWarehouseBinDto } from './dto/update-master-warehouse-bin.dto';
import { MasterWarehouseBin } from 'src/core/domain/entities/master-warehouse-bin.entity';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';

@Injectable()
export class MasterWarehouseBinService {
  constructor(
    private readonly repository: MasterWarehouseBinRepository,
    private readonly barcodeService: BarcodeService,
  ) {}

  async create(
    createMasterWarehouseBinDto: CreateMasterWarehouseBinDto,
  ): Promise<MasterWarehouseBin> {
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

  async findByOrganizationId(organization_id: number): Promise<MasterWarehouseBin[]> {
    return await this.repository.findByOrganizationId(organization_id);
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

    const updatedWarehouseBin = await this.repository.update(id, updateMasterWarehouseBinDto);
    if (!updatedWarehouseBin) {
      throw new NotFoundException(`Warehouse Bin with ID ${id} not found`);
    }
    return updatedWarehouseBin;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async getStagingPalletsWithSuggestions(): Promise<{
    palletSuggestions: Array<{
      stagingPallet: any;
      suggestedBin: MasterWarehouseBin;
      suggestedZone: any;
      palletItems: any[];
    }>;
  }> {
    return await this.repository.getStagingPalletsWithSuggestions();
  }
}
