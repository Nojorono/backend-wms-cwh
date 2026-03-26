import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedHelper } from '../../core/domain/entities/assigned-helper.entity';
import { User } from '../../core/domain/entities/user.entity';

@Injectable()
export class AssignedHelperRepository {
  constructor(
    @InjectRepository(AssignedHelper)
    private readonly repository: Repository<AssignedHelper>,
  ) { }

  async create(data: Partial<AssignedHelper>): Promise<AssignedHelper> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<AssignedHelper[]> {
    return await this.repository
      .createQueryBuilder('helper')
      .leftJoinAndSelect('helper.inbound', 'inbound')
      .leftJoinAndMapOne(
        'helper.user',
        User,
        'user',
        '"user"."id" = helper.helper_user_id::uuid',
      )
      .getMany();
  }

  async findAllByInbound(inboundId: string): Promise<AssignedHelper[]> {
    return await this.repository
      .createQueryBuilder('helper')
      .leftJoinAndSelect('helper.inbound', 'inbound')
      .leftJoinAndMapOne(
        'helper.user',
        User,
        'user',
        '"user"."id" = helper.helper_user_id::uuid',
      )
      .where('helper.inbound_id = :inboundId', { inboundId })
      .getMany();
  }

  async findOne(id: string): Promise<AssignedHelper | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['inbound'],
    });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<AssignedHelper>): Promise<AssignedHelper | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedHelper not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedHelper not found');
    }
    await this.repository.softDelete(id);
  }

  async removeByInbound(inboundId: string): Promise<void> {
    await this.repository.softDelete({ inbound_id: inboundId });
  }

  async findByInboundId(inbound_id: string): Promise<AssignedHelper[]> {
    return await this.repository.find({ where: { inbound_id } });
  }
}
