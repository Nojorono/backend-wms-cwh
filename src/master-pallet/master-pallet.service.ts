import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MasterPalletRepository } from './master-pallet.repository';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';

@Injectable()
export class MasterPalletService {
  constructor(
    private readonly repository: MasterPalletRepository,
    private readonly barcodeService: BarcodeService,
  ) {}

  async create(createMasterPalletDto: CreateMasterPalletDto): Promise<MasterPallet> {
    const existingPallet = await this.repository.findByPalletCode(createMasterPalletDto.pallet_code);
    if (existingPallet) {
      throw new ConflictException(`Pallet with pallet code ${createMasterPalletDto.pallet_code} already exists`);
    }

    const barcodeImageUrl = await this.barcodeService.generateAndStoreBarcode({
      bcid: 'code128',
      text: `${createMasterPalletDto.pallet_code}`,
      scale: 3,
      height: 100,
      width: 200,
      bucket: 'wms',
      prefix: 'pallet',
      extension: 'png',
      acl: 'public-read',
      metadata: {
        pallet_code: createMasterPalletDto.pallet_code,
        pallet_capacity: createMasterPalletDto.capacity?.toString() || '0',
      } as Record<string, string>
    });
   
    const pallet = await this.repository.create({...createMasterPalletDto, barcode_image_url: barcodeImageUrl.url});
    
    
    return pallet;
  }

  async findAll(): Promise<MasterPallet[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterPallet> {
    const pallet = await this.repository.findOne(id);
    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }
    return pallet;
  }

  async update(id: string, updateMasterPalletDto: UpdateMasterPalletDto): Promise<MasterPallet> {
    const pallet = await this.findOne(id);
    if (!pallet) {
      throw new NotFoundException('Pallet not found');
    }
    if (updateMasterPalletDto.pallet_code && updateMasterPalletDto.pallet_code !== pallet.pallet_code) {
      const existingPallet = await this.repository.findByPalletCode(updateMasterPalletDto.pallet_code);
      if (existingPallet) {
        throw new ConflictException(`Pallet with pallet code ${updateMasterPalletDto.pallet_code} already exists`);
      }
    }
    if (updateMasterPalletDto.capacity && updateMasterPalletDto.capacity !== pallet.capacity || updateMasterPalletDto.pallet_code && updateMasterPalletDto.pallet_code !== pallet.pallet_code) {
      await this.barcodeService.deleteBarcodeImage(pallet.barcode_image_url);
      const barcodeImageUrl = await this.barcodeService.generateAndStoreBarcode({
        bcid: 'code128',
        text: `${updateMasterPalletDto.pallet_code}`,
        scale: 3,
        height: 100,
        width: 200,
        bucket: 'wms',
        prefix: 'pallet',
        extension: 'png',
        acl: 'public-read',
        metadata: {
          pallet_code: updateMasterPalletDto.pallet_code,
          pallet_capacity: updateMasterPalletDto.capacity?.toString() || '0',
        } as Record<string, string>
      });
      updateMasterPalletDto.barcode_image_url = barcodeImageUrl.url;
    }
    const updatedPallet = await this.repository.update(id, updateMasterPalletDto);
    if (!updatedPallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }
    return updatedPallet;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
