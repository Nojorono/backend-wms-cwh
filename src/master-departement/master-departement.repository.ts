import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterDepartement } from '../core/domain/entities/matser-departement.entity';
import { CreateMasterDepartementDto } from './dto/create-master-departement.dto';
import { UpdateMasterDepartementDto } from './dto/update-master-departement.dto';

@Injectable()
export class MasterDepartementRepository {
  constructor(
    @InjectRepository(MasterDepartement)
    private readonly repository: Repository<MasterDepartement>,
  ) {}

  async create(createDto: CreateMasterDepartementDto): Promise<MasterDepartement> {
    const entity = this.repository.create(createDto);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<MasterDepartement[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterDepartement | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async findByDepartementCode(departement_code: string): Promise<MasterDepartement | null> {
    const entity = await this.repository.findOne({ where: { departement_code } });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateMasterDepartementDto): Promise<MasterDepartement | null> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new NotFoundException('Departement not found');
    }
    await this.repository.update(id, updateDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    if (!entity) {
      throw new NotFoundException('Departement not found');
    }
    await this.repository.delete(id);
  }
}
