import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CheckerAssign } from '../core/domain/entities/checker-assign.entity';
import { CreateCheckerAssignDto } from './dto/create-checker-assign.dto';
import { UpdateCheckerAssignDto } from './dto/update-checker-assign.dto';
import { User } from '../core/domain/entities/user.entity';

@Injectable()
export class CheckerAssignRepository {  
  constructor(
    @InjectRepository(CheckerAssign)
    private readonly repository: Repository<CheckerAssign>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createCheckerAssignDto: CreateCheckerAssignDto): Promise<CheckerAssign> {
    const checkers = await this.userRepository.find({ where: { id: In(createCheckerAssignDto.checkers?.map(checker => checker.id) || []) } });
    const checkerAssign = this.repository.create({
      ...createCheckerAssignDto,
      checkers,
    });
    return await this.repository.save(checkerAssign);
  }

  async findAll(): Promise<CheckerAssign[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<CheckerAssign | null> {
    const checkerAssign = await this.repository.findOne({ where: { id } });
    if (!checkerAssign) {
      return null;
    }
    return checkerAssign;
  }

  async findByInboundPlanId(inboundPlanId: string): Promise<CheckerAssign | null> {
    const checkerAssign = await this.repository.findOne({ where: { inbound_plan_id: inboundPlanId } });
    if (!checkerAssign) {
      return null;
    }
    return checkerAssign;
  }

  async update(id: string, updateCheckerAssignDto: UpdateCheckerAssignDto): Promise<CheckerAssign | null> {
    const checkerAssign = await this.findOne(id);
    if (!checkerAssign) {
      throw new NotFoundException('Checker Assign not found');
    }
    await this.repository.update(id, {
      ...updateCheckerAssignDto,
      checkers: updateCheckerAssignDto.checkers ? await this.userRepository.find({ where: { id: In(updateCheckerAssignDto.checkers?.map(checker => checker.id) || []) } }) : undefined,
    });
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
      const checkerAssign = await this.findOne(id);
    if (!checkerAssign) {
      throw new NotFoundException('Checker Assign not found');
    }
    await this.repository.delete(id);
  }
}
