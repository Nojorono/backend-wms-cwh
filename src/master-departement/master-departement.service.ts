import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MasterDepartementRepository } from './master-departement.repository';
import { CreateMasterDepartementDto } from './dto/create-master-departement.dto';
import { UpdateMasterDepartementDto } from './dto/update-master-departement.dto';
import { MasterDepartement } from '../core/domain/entities/matser-departement.entity';

@Injectable()
export class MasterDepartementService {
  constructor(private readonly repository: MasterDepartementRepository) {}

  async create(createDto: CreateMasterDepartementDto): Promise<MasterDepartement> {
    const code = createDto.departement_code;
    if (!code) {
      throw new BadRequestException('Departement code is required');
    }

    const existing = await this.repository.findByDepartementCode(code);
    if (existing) {
      throw new ConflictException(`Departement with code ${code} already exists`);
    }

    return await this.repository.create(createDto);
  }

  async findAll(): Promise<MasterDepartement[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterDepartement> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Departement with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateMasterDepartementDto): Promise<MasterDepartement> {
    const existing = await this.findOne(id);

    if (
      updateDto.departement_code &&
      updateDto.departement_code !== existing.departement_code
    ) {
      const duplicate = await this.repository.findByDepartementCode(updateDto.departement_code);
      if (duplicate) {
        throw new ConflictException(
          `Departement with code ${updateDto.departement_code} already exists`,
        );
      }
    }

    const updated = await this.repository.update(id, updateDto);
    if (!updated) {
      throw new NotFoundException(`Departement with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
