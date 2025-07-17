import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CheckerScanningRepository } from './checker-scanning.repository';
import { CreateItemCheckerScanningDto } from './dto/create-checker-scanning.dto';
import { UpdateCheckerScanningDto } from './dto/update-checker-scanning.dto';
import { CheckerScanning } from '../core/domain/entities/checker-scanning.entity';

@Injectable()
export class CheckerScanningService {
  constructor(private readonly repository: CheckerScanningRepository) {}
  
  async create(createItemCheckerScanningDto: CreateItemCheckerScanningDto): Promise<CreateItemCheckerScanningDto> {
    const existingCheckerScanning = await this.repository.findByInboundDeliveryOrderId(createItemCheckerScanningDto.inbound_delivery_order_id);
    if (existingCheckerScanning) {
      throw new ConflictException(`Checker scanning with inbound delivery order ID ${createItemCheckerScanningDto.inbound_delivery_order_id} already exists`);
    }
    
    for (const item of createItemCheckerScanningDto.items) {
      await this.repository.create({
        ...createItemCheckerScanningDto,
        ...item,
      });
    }
    return createItemCheckerScanningDto;
  }

  async findAll(): Promise<CheckerScanning[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<CheckerScanning> {
    const checkerScanning = await this.repository.findOne(id);
    if (!checkerScanning) {
      throw new NotFoundException(`Checker scanning with ID ${id} not found`);
    }
    return checkerScanning;
  }

  async findByInboundPlanId(inbound_plan_id: string): Promise<CheckerScanning[]> {
    const checkerScanning = await this.repository.findByInboundPlanId(inbound_plan_id);
    if (!checkerScanning) {
      return [];
    }
    return checkerScanning;

  }

  async update(id: string, updateCheckerScanningDto: UpdateCheckerScanningDto): Promise<CheckerScanning> {
    const updatedCheckerScanning = await this.repository.update(id, updateCheckerScanningDto);
    if (!updatedCheckerScanning) {
      throw new NotFoundException(`Checker scanning with ID ${id} not found`);
    }
    return updatedCheckerScanning;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
