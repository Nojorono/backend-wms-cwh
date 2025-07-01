import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckerScanning } from '../core/domain/entities/checker-scanning.entity';
import { CreateCheckerScanningDto } from './dto/create-checker-scanning.dto';
import { UpdateCheckerScanningDto } from './dto/update-checker-scanning.dto';
import { InboundPlanItem } from 'src/core/domain/entities/inbound-plan-item.entity';
import { User } from 'src/core/domain/entities/user.entity';

@Injectable()
export class CheckerScanningRepository {
  constructor(
    @InjectRepository(CheckerScanning)
    private readonly repository: Repository<CheckerScanning>,
    @InjectRepository(InboundPlanItem)
    private readonly inboundPlanItemRepository: Repository<InboundPlanItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    ) {}

  async create(createCheckerScanningDto: CreateCheckerScanningDto): Promise<CheckerScanning> {
    const inboundPlanItem = await this.inboundPlanItemRepository.findOne({ where: { id: createCheckerScanningDto.inbound_plan_item_id } });
    if (!inboundPlanItem) {
      throw new NotFoundException('Inbound plan item not found');
    }
    const checker = await this.userRepository.findOne({ where: { id: createCheckerScanningDto.checker_id } });
    if (!checker) {
      throw new NotFoundException('Checker not found');
    }
    const checkerScanning = this.repository.create({
      ...createCheckerScanningDto,
      inbound_plan_item: inboundPlanItem,
      checker: checker,
    });
    return await this.repository.save(checkerScanning);
  }

  async findAll(): Promise<CheckerScanning[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<CheckerScanning | null> {
    const checkerScanning = await this.repository.findOne({ where: { id } });
    if (!checkerScanning) {
      return null;
    }
    return checkerScanning;
  }

  async findByInboundPlanItemId(inbound_plan_item_id: string): Promise<CheckerScanning | null> {
    const checkerScanning = await this.repository.findOne({ where: { inbound_plan_item: { id: inbound_plan_item_id } } });
    if (!checkerScanning) {
      return null;
    }
    return checkerScanning;
  }

  async findByInboundPlanId(inbound_plan_id: string): Promise<CheckerScanning[]> {
    const checkerScanning = await this.repository.find({ where: { inbound_plan_item: { inbound_plan: { id: inbound_plan_id } } } });
    if (!checkerScanning) {
      return [];
    }
    return checkerScanning;
  }

  async update(id: string, updateCheckerScanningDto: UpdateCheckerScanningDto): Promise<CheckerScanning | null> {
    const checkerScanning = await this.findOne(id);
    if (!checkerScanning) {
      throw new NotFoundException('IO not found');
    }
    await this.repository.update(id, updateCheckerScanningDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const checkerScanning = await this.findOne(id);
    if (!checkerScanning) {
      throw new NotFoundException('IO not found');
    }
    await this.repository.delete(id);
  }
}
