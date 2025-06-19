import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MasterPalletRepository } from './master-pallet.repository';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';

@Injectable()
export class MasterPalletService {
  constructor(private readonly repository: MasterPalletRepository) {}

  async create(createMasterPalletDto: CreateMasterPalletDto): Promise<MasterPallet> {
    const existingPallet = await this.repository.findByCode(createMasterPalletDto.code);
    if (existingPallet) {
      throw new ConflictException(`Pallet with code ${createMasterPalletDto.code} already exists`);
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

  async update(id: number, updateMasterPalletDto: UpdateMasterPalletDto): Promise<MasterPallet> {
    const pallet = await this.findOne(id);
    if (updateMasterPalletDto.code && updateMasterPalletDto.code !== pallet.code) {
      const existingPallet = await this.repository.findByCode(updateMasterPalletDto.code);
      if (existingPallet) {
        throw new ConflictException(`Pallet with code ${updateMasterPalletDto.code} already exists`);
      }
    }
    return await this.repository.update(id, updateMasterPalletDto);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
