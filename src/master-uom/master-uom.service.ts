import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MasterUomRepository } from './master-uom.repository';
import { CreateMasterUomDto } from './dto/create-master-uom.dto';
import { UpdateMasterUomDto } from './dto/update-master-uom.dto';
import { MasterUom } from '../core/domain/entities/master-uom.entity';

@Injectable()
export class MasterUomService {
  constructor(private readonly repository: MasterUomRepository) {}

  async create(createMasterUomDto: CreateMasterUomDto): Promise<MasterUom> {
    const existingUom = await this.repository.findByCode(createMasterUomDto.code);
    if (existingUom) {
      throw new ConflictException(`UOM with code ${createMasterUomDto.code} already exists`);
    }
    return await this.repository.create(createMasterUomDto);
  }

  async findAll(): Promise<MasterUom[]> {
    return await this.repository.findAll();
  }

  async findOne(id: number): Promise<MasterUom> {
    const uom = await this.repository.findOne(id);
    if (!uom) {
      throw new NotFoundException(`UOM with ID ${id} not found`);
    }
    return uom;
  }

  async update(id: number, updateMasterUomDto: UpdateMasterUomDto): Promise<MasterUom> {
    const uom = await this.findOne(id);
    if (updateMasterUomDto.code && updateMasterUomDto.code !== uom.code) {
      const existingUom = await this.repository.findByCode(updateMasterUomDto.code);
      if (existingUom) {
        throw new ConflictException(`UOM with code ${updateMasterUomDto.code} already exists`);
      }
    }
    const updatedUom = await this.repository.update(id, updateMasterUomDto);
    if (!updatedUom) {
      throw new NotFoundException(`UOM with ID ${id} not found`);
    }
    return updatedUom;
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
