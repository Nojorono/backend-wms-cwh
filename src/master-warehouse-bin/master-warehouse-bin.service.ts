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
    const barcodeImageUrl = await this.barcodeService.generateAndStoreBarcode({
      bcid: 'code128',
      text:
        `${createMasterWarehouseBinDto.code}-${createMasterWarehouseBinDto.name}` ||
        '',
      scale: 3,
      height: 100,
      width: 200,
      bucket: 'wms',
      prefix: 'warehouse-bin',
      extension: 'png',
      acl: 'public-read',
      metadata: {
        organization_id:
          createMasterWarehouseBinDto.organization_id?.toString() || '',
        warehouse_sub_id: createMasterWarehouseBinDto.warehouse_sub_id || '',
        warehouse_bin_id: createMasterWarehouseBinDto.code || '',
        warehouse_bin_name: createMasterWarehouseBinDto.name || '',
        warehouse_bin_capacity_pallet:
          createMasterWarehouseBinDto.capacity_pallet?.toString() || '',
      },
    });
    createMasterWarehouseBinDto.barcode_image_url = barcodeImageUrl.url;
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

  async findByOrganizationId(
    organization_id: number,
  ): Promise<MasterWarehouseBin[]> {
    return await this.repository.findByOrganizationId(organization_id);
  }

  async findByWarehouseSubId(
    warehouse_sub_id: string,
  ): Promise<MasterWarehouseBin[]> {
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
    if (
      updateMasterWarehouseBinDto.code ||
      updateMasterWarehouseBinDto.name ||
      updateMasterWarehouseBinDto.capacity_pallet
    ) {
      // delete old barcode image
      if (warehouseBin.barcode_image_url) {
        await this.barcodeService.deleteBarcodeImage(
          warehouseBin.barcode_image_url,
        );
      }
      const barcodeImageUrl = await this.barcodeService.generateAndStoreBarcode(
        {
          bcid: 'code128',
          text:
            `${updateMasterWarehouseBinDto.code}-${updateMasterWarehouseBinDto.name}` ||
            '',
          scale: 3,
          height: 100,
          width: 200,
          bucket: 'wms',
          prefix: 'warehouse-bin',
          extension: 'png',
          acl: 'public-read',
          metadata: {
            organization_id: warehouseBin.organization_id?.toString() || '',
            warehouse_sub_id: warehouseBin.warehouse_sub_id || '',
            warehouse_bin_id: updateMasterWarehouseBinDto.code || '',
            warehouse_bin_name: updateMasterWarehouseBinDto.name || '',
            warehouse_bin_description:
              updateMasterWarehouseBinDto.description ||
              warehouseBin.description ||
              '',
            warehouse_bin_capacity_pallet:
              updateMasterWarehouseBinDto.capacity_pallet?.toString() || '',
          },
        },
      );
      updateMasterWarehouseBinDto.barcode_image_url = barcodeImageUrl.url;
    }

    const updatedWarehouseBin = await this.repository.update(
      id,
      updateMasterWarehouseBinDto,
    );
    if (!updatedWarehouseBin) {
      throw new NotFoundException(`Warehouse Bin with ID ${id} not found`);
    }
    return updatedWarehouseBin;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
