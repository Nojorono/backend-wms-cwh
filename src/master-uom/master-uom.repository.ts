import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterUom } from '../core/domain/entities/master-uom.entity';
import { CreateMasterUomDto } from './dto/create-master-uom.dto';
import { UpdateMasterUomDto } from './dto/update-master-uom.dto';

@Injectable()
export class MasterUomRepository {
  constructor(
    @InjectRepository(MasterUom)
    private readonly repository: Repository<MasterUom>,
  ) {}

  async create(createMasterUomDto: CreateMasterUomDto): Promise<MasterUom> {
    const uom = this.repository.create(createMasterUomDto);
    return await this.repository.save(uom);
  }

  async findAll(): Promise<MasterUom[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterUom | null> {
    const uom = await this.repository.findOne({ where: { id } });
    if (!uom) {
      return null;
    }
    return uom;
  }

  async findByCode(code: string): Promise<MasterUom | null> {
    const uom = await this.repository.findOne({ where: { code } });
    if (!uom) {
      return null;
    }
    return uom;
  }

  async update(id: string, updateMasterUomDto: UpdateMasterUomDto): Promise<MasterUom | null> {
    const uom = await this.findOne(id);
    if (!uom) {
      throw new NotFoundException('UOM not found');
    }
    await this.repository.update(id, updateMasterUomDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const uom = await this.findOne(id);
    if (!uom) {
      throw new NotFoundException('UOM not found');
    }
    await this.repository.delete(id);
  }
}
