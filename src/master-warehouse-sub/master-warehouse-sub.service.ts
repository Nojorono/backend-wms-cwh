import { Injectable, NotFoundException } from '@nestjs/common';
import { MasterWarehouseSubRepository } from './master-warehouse-sub.repository';
import { CreateMasterWarehouseSubDto } from './dto/create-master-warehouse-sub.dto';
import { UpdateMasterWarehouseSubDto } from './dto/update-master-warehouse-sub.dto';
import { MasterWarehouseSub } from 'src/core/domain/entities/master-warehouse-sub.entity';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';

@Injectable()
export class MasterWarehouseSubService {
  constructor(
    private readonly repository: MasterWarehouseSubRepository,
    private readonly barcodeService: BarcodeService,
  ) {}

  async create(
    createMasterWarehouseSubDto: CreateMasterWarehouseSubDto,
  ): Promise<MasterWarehouseSub> {
    const barcodeImageUrl = await this.barcodeService.generateAndStoreBarcode({
      bcid: 'code128',
      text: createMasterWarehouseSubDto.code || '',
      scale: 3,
      height: 100,
      width: 200,
      bucket: 'wms',
      prefix: 'warehouse-sub',
      extension: 'png',
      acl: 'public-read',
      metadata: {
        organization_id:
          createMasterWarehouseSubDto.organization_id?.toString() || '',
        warehouse_sub_id: createMasterWarehouseSubDto.code || '',
        warehouse_sub_name: createMasterWarehouseSubDto.name || '',
        warehouse_sub_capacity_bin:
          createMasterWarehouseSubDto.capacity_bin?.toString() || '',
      },
    });
    createMasterWarehouseSubDto.barcode_image_url = barcodeImageUrl.url;
    return await this.repository.create(createMasterWarehouseSubDto);
  }

  async findAll(): Promise<MasterWarehouseSub[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterWarehouseSub> {
    const warehouseSub = await this.repository.findOne(id);
    if (!warehouseSub) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouseSub;
  }

  async findByOrganizationId(
    organization_id: number,
  ): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByOrganizationId(organization_id);
  }

  async findByWarehouseId(warehouse_id: string): Promise<MasterWarehouseSub[]> {
    return await this.repository.findByWarehouseId(warehouse_id);
  }

  async update(
    id: string,
    updateMasterWarehouseSubDto: UpdateMasterWarehouseSubDto,
  ): Promise<MasterWarehouseSub> {
    const warehouseSub = await this.findOne(id);
    if (!warehouseSub) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    if (
      updateMasterWarehouseSubDto.code ||
      updateMasterWarehouseSubDto.name ||
      updateMasterWarehouseSubDto.capacity_bin
    ) {
      await this.barcodeService.deleteBarcodeImage(
        warehouseSub.barcode_image_url,
      );
      const barcodeImageUrl = await this.barcodeService.generateAndStoreBarcode(
        {
          bcid: 'code128',
          text: updateMasterWarehouseSubDto.code || '',
          scale: 3,
          height: 100,
          width: 200,
          bucket: 'wms',
          prefix: 'warehouse-sub',
          extension: 'png',
          acl: 'public-read',
          metadata: {
            organization_id:
              updateMasterWarehouseSubDto.organization_id?.toString() || '',
            warehouse_sub_id: updateMasterWarehouseSubDto.code || '',
            warehouse_sub_name: updateMasterWarehouseSubDto.name || '',
            warehouse_sub_capacity_bin:
              updateMasterWarehouseSubDto.capacity_bin?.toString() || '',
          },
        },
      );
      updateMasterWarehouseSubDto.barcode_image_url = barcodeImageUrl.url;
    }
    const updatedWarehouseSub = await this.repository.update(
      id,
      updateMasterWarehouseSubDto,
    );
    if (!updatedWarehouseSub) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return updatedWarehouseSub;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
