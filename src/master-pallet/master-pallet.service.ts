import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MasterPalletRepository } from './master-pallet.repository';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';

@Injectable()
export class MasterPalletService {
  constructor(private readonly repository: MasterPalletRepository) {}

  async create(createMasterPalletDto: CreateMasterPalletDto): Promise<MasterPallet> {
    const existingPallet = await this.repository.findByPalletCode(createMasterPalletDto.pallet_code);
    if (existingPallet) {
      throw new ConflictException(`Pallet with pallet code ${createMasterPalletDto.pallet_code} already exists`);
    }
    return await this.repository.create(createMasterPalletDto);
  }

  async findAll(): Promise<MasterPallet[]> {
    return await this.repository.findAll();
  }

  async findOne(id: number): Promise<MasterPallet> {
    const pallet = await this.repository.findOne(id);
    if (!pallet) {
      throw new NotFoundException(`Pallet with ID ${id} not found`);
    }
    return pallet;
  }

  async update(id: number, updateMasterPalletDto: UpdateMasterPalletDto): Promise<MasterPallet | null> {
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
    return await this.repository.update(id, updateMasterPalletDto);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
