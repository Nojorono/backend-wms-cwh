import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';

@Injectable()
export class MasterPalletRepository {
  constructor(
    @InjectRepository(MasterPallet)
    private readonly repository: Repository<MasterPallet>,
  ) {}

  async create(createMasterPalletDto: CreateMasterPalletDto): Promise<MasterPallet> {
    const pallet = this.repository.create(createMasterPalletDto);
    return await this.repository.save(pallet);
  }

  async findAll(): Promise<MasterPallet[]> {
    return await this.repository.find();
  }

  async findOne(id: number): Promise<MasterPallet> {
    const pallet = await this.repository.findOne({ where: { id } });
    if (!pallet) {
      throw new NotFoundException('Pallet not found');
    }
    return pallet;
  }

  async findByCode(code: string): Promise<MasterPallet> {
    const pallet = await this.repository.findOne({ where: { code } });
    if (!pallet) {
      throw new NotFoundException('Pallet not found');
    }
    return pallet;
  }

  async update(id: number, updateMasterPalletDto: UpdateMasterPalletDto): Promise<MasterPallet> {
    const pallet = await this.findOne(id);
    if (!pallet) {
      throw new NotFoundException('Pallet not found');
    }
    await this.repository.update(id, updateMasterPalletDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
