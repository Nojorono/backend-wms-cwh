import { Injectable, NotFoundException } from '@nestjs/common';
import { PutAwayRepository } from './put-away.repository';
import { CreatePutAwayDto, UpdatePutAwayDto } from './dto/create-put-away.dto';
import { PutAwayTransaction } from 'src/core/domain/entities/transaction-put-away.entity';

@Injectable()
export class PutAwayService {
  constructor(private readonly repository: PutAwayRepository) {}

  async create(dto: CreatePutAwayDto): Promise<PutAwayTransaction> {
    return this.repository.create(dto);
  }

  async findAll(): Promise<PutAwayTransaction[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<PutAwayTransaction> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Put Away with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, dto: UpdatePutAwayDto): Promise<PutAwayTransaction> {
    const updated = await this.repository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Put Away with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}


