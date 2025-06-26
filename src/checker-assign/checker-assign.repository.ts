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
    
    let checkerLeader: User | undefined = undefined;
    if (createCheckerAssignDto.checker_leader_id) {
      checkerLeader = await this.userRepository.findOne({ where: { id: createCheckerAssignDto.checker_leader_id } }) || undefined;
    }
    
    const checkerAssign = this.repository.create({
      inbound_plan_id: createCheckerAssignDto.inbound_plan_id,
      checker_leader: checkerLeader,
      checkers,
      status: createCheckerAssignDto.status,
      assign_date_start: createCheckerAssignDto.assign_date_start,
      assign_date_finish: createCheckerAssignDto.assign_date_finish,
    });
    return await this.repository.save(checkerAssign);
  }

  async findAll(): Promise<CheckerAssign[]> {
    return await this.repository
      .createQueryBuilder('checkerAssign')
      .leftJoinAndSelect('checkerAssign.inbound_plan', 'inbound_plan')
      .leftJoinAndSelect('checkerAssign.checker_leader', 'checker_leader')
      .leftJoinAndSelect('checkerAssign.checkers', 'checkers')
      .select([
        'checkerAssign',
        'inbound_plan',
        'checker_leader.id',
        'checker_leader.username',
        'checker_leader.organizationId',
        'checker_leader.firstName',
        'checker_leader.lastName',
        'checker_leader.isActive',
        'checker_leader.createdAt',
        'checker_leader.updatedAt',
        'checkers.id',
        'checkers.username',
        'checkers.organizationId',
        'checkers.firstName',
        'checkers.lastName',
        'checkers.isActive',
        'checkers.createdAt',
        'checkers.updatedAt'
      ])
      .getMany();
  }
  async findOne(id: string): Promise<CheckerAssign | null> {
    const checkerAssign = await this.repository
      .createQueryBuilder('checkerAssign')
      .leftJoinAndSelect('checkerAssign.inbound_plan', 'inbound_plan')
      .leftJoinAndSelect('checkerAssign.checker_leader', 'checker_leader')
      .leftJoinAndSelect('checkerAssign.checkers', 'checkers')
      .select([
        'checkerAssign',
        'inbound_plan',
        'checker_leader.id',
        'checker_leader.username',
        'checker_leader.organizationId',
        'checker_leader.firstName',
        'checker_leader.lastName',
        'checker_leader.isActive',
        'checker_leader.createdAt',
        'checker_leader.updatedAt',
        'checkers.id',
        'checkers.username',
        'checkers.organizationId',
        'checkers.firstName',
        'checkers.lastName',
        'checkers.isActive',
        'checkers.createdAt',
        'checkers.updatedAt'
      ])
      .where('checkerAssign.id = :id', { id })
      .getOne();
    
    if (!checkerAssign) {
      return null;
    }
    return checkerAssign;
  }

  async findByInboundPlanId(inboundPlanId: string): Promise<CheckerAssign | null> {
    const checkerAssign = await this.repository
      .createQueryBuilder('checkerAssign')
      .leftJoinAndSelect('checkerAssign.inbound_plan', 'inbound_plan')
      .leftJoinAndSelect('checkerAssign.checker_leader', 'checker_leader')
      .leftJoinAndSelect('checkerAssign.checkers', 'checkers')
      .select([
        'checkerAssign',
        'inbound_plan',
        'checker_leader.id',
        'checker_leader.username',
        'checker_leader.organizationId',
        'checker_leader.firstName',
        'checker_leader.lastName',
        'checker_leader.isActive',
        'checker_leader.createdAt',
        'checker_leader.updatedAt',
        'checkers.id',
        'checkers.username',
        'checkers.organizationId',
        'checkers.firstName',
        'checkers.lastName',
        'checkers.isActive',
        'checkers.createdAt',
        'checkers.updatedAt'
      ])
      .where('checkerAssign.inbound_plan_id = :inboundPlanId', { inboundPlanId })
      .getOne();
    
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
    
    let checkerLeader: User | undefined = undefined;
    if (updateCheckerAssignDto.checker_leader_id) {
      checkerLeader = await this.userRepository.findOne({ where: { id: updateCheckerAssignDto.checker_leader_id } }) || undefined;
    }
    
    await this.repository.update(id, {
      inbound_plan_id: updateCheckerAssignDto.inbound_plan_id,
      checker_leader: checkerLeader,
      checkers: updateCheckerAssignDto.checkers ? await this.userRepository.find({ where: { id: In(updateCheckerAssignDto.checkers?.map(checker => checker.id) || []) } }) : undefined,
      status: updateCheckerAssignDto.status,
      assign_date_start: updateCheckerAssignDto.assign_date_start,
      assign_date_finish: updateCheckerAssignDto.assign_date_finish,
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

  async findByCheckerLeaderId(checkerLeaderId: string): Promise<CheckerAssign[]> {
    return await this.repository
      .createQueryBuilder('checkerAssign')
      .leftJoinAndSelect('checkerAssign.inbound_plan', 'inbound_plan')
      .leftJoinAndSelect('checkerAssign.checker_leader', 'checker_leader')
      .leftJoinAndSelect('checkerAssign.checkers', 'checkers')
      .select([
        'checkerAssign',
        'inbound_plan',
        'checker_leader.id',
        'checker_leader.username',
        'checker_leader.organizationId',
        'checker_leader.firstName',
        'checker_leader.lastName',
        'checker_leader.isActive',
        'checker_leader.createdAt',
        'checker_leader.updatedAt',
        'checkers.id',
        'checkers.username',
        'checkers.organizationId',
        'checkers.firstName',
        'checkers.lastName',
        'checkers.isActive',
        'checkers.createdAt',
        'checkers.updatedAt'
      ])
      .where('checker_leader.id = :checkerLeaderId', { checkerLeaderId })
      .getMany();
  }

  async findByCheckerId(checkerId: string): Promise<CheckerAssign[]> {
    return await this.repository
      .createQueryBuilder('checkerAssign')
      .leftJoinAndSelect('checkerAssign.checker_leader', 'checker_leader')
      .leftJoinAndSelect('checkerAssign.checkers', 'checkers')
      .leftJoinAndSelect('checkerAssign.inbound_plan', 'inbound_plan')
      .select([
        'checkerAssign',
        'inbound_plan',
        'checker_leader.id',
        'checker_leader.username',
        'checker_leader.organizationId',
        'checker_leader.firstName',
        'checker_leader.lastName',
        'checker_leader.isActive',
        'checker_leader.createdAt',
        'checker_leader.updatedAt',
        'checkers.id',
        'checkers.username',
        'checkers.organizationId',
        'checkers.firstName',
        'checkers.lastName',
        'checkers.isActive',
        'checkers.createdAt',
        'checkers.updatedAt'
      ])
      .where('checkers.id = :checkerId', { checkerId })
      .getMany();
  }

  async findByUserInvolved(userId: string): Promise<CheckerAssign[]> {
    return await this.repository
      .createQueryBuilder('checkerAssign')
      .leftJoinAndSelect('checkerAssign.checker_leader', 'checker_leader')
      .leftJoinAndSelect('checkerAssign.checkers', 'checkers')
      .leftJoinAndSelect('checkerAssign.inbound_plan', 'inbound_plan')
      .select([
        'checkerAssign',
        'inbound_plan',
        'checker_leader.id',
        'checker_leader.username',
        'checker_leader.organizationId',
        'checker_leader.firstName',
        'checker_leader.lastName',
        'checker_leader.isActive',
        'checker_leader.createdAt',
        'checker_leader.updatedAt',
        'checkers.id',
        'checkers.username',
        'checkers.organizationId',
        'checkers.firstName',
        'checkers.lastName',
        'checkers.isActive',
        'checkers.createdAt',
        'checkers.updatedAt'
      ])
      .where('checker_leader.id = :userId', { userId })
      .orWhere('checkers.id = :userId', { userId })
      .getMany();
  }
}
