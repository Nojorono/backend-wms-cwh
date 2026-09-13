import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledTask } from '../core/domain/entities/scheduled-task.entity';

@Injectable()
export class ScheduledTaskRepository {
  constructor(
    @InjectRepository(ScheduledTask)
    private readonly repository: Repository<ScheduledTask>,
  ) {}

  async findByName(name: string, withDeleted = false): Promise<ScheduledTask | null> {
    return await this.repository.findOne({
      where: { name },
      withDeleted,
    });
  }

  async restoreByName(name: string): Promise<void> {
    await this.repository.restore({ name });
  }

  async findAllActive(): Promise<ScheduledTask[]> {
    return await this.repository.find({ where: { isActive: true } });
  }

  async findAll(): Promise<ScheduledTask[]> {
    return await this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async create(task: Partial<ScheduledTask>): Promise<ScheduledTask> {
    const entity = this.repository.create(task);
    return await this.repository.save(entity);
  }

  async softDeleteByName(name: string): Promise<void> {
    await this.repository.softDelete({ name });
  }

  async hardDeleteByName(name: string): Promise<void> {
    await this.repository.delete({ name });
  }
}
