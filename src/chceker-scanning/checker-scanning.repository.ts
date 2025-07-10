import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckerScanning } from '../core/domain/entities/checker-scanning.entity';
import { CreateCheckerScanningDto } from './dto/create-checker-scanning.dto';
import { UpdateCheckerScanningDto } from './dto/update-checker-scanning.dto';
import { User } from 'src/core/domain/entities/user.entity';
import { InboundDeliveryOrder } from 'src/core/domain/entities/inbound-delivery-order.entity';

@Injectable()
export class CheckerScanningRepository {
  constructor(
    @InjectRepository(CheckerScanning)
    private readonly repository: Repository<CheckerScanning>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(InboundDeliveryOrder)
    private readonly inboundDeliveryOrderRepository: Repository<InboundDeliveryOrder>,
    ) {}

  async create(createCheckerScanningDto: CreateCheckerScanningDto): Promise<CheckerScanning> {
    const checker = await this.userRepository.findOne({ where: { id: createCheckerScanningDto.checker_id } });
    if (!checker) {
      throw new NotFoundException('Checker not found');
    }
    const inboundDeliveryOrder = await this.inboundDeliveryOrderRepository.findOne({ where: { id: createCheckerScanningDto.inbound_delivery_order_id } });
    if (!inboundDeliveryOrder) {
      throw new NotFoundException('Inbound delivery order not found');
    }
    const checkerScanning = this.repository.create({
      ...createCheckerScanningDto,
      checker: checker,
      inbound_delivery_order_id: inboundDeliveryOrder.id,
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
  async findByInboundDeliveryOrderId(inbound_delivery_order_id: string): Promise<CheckerScanning[]> {
    const checkerScanning = await this.repository.find({ where: { inbound_delivery_order_id } });
    if (!checkerScanning) {
      return [];
    }
    return checkerScanning;
  }

  async findByInboundPlanId(inbound_plan_id: string): Promise<CheckerScanning[]> {
    const checkerScanning = await this.repository.find({ where: { inbound_plan_id } });
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
