import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CheckerScanningRepository } from './checker-scanning.repository';
import { CreateCheckerScanningDto } from './dto/create-checker-scanning.dto';
import { UpdateCheckerScanningDto } from './dto/update-checker-scanning.dto';
import { CheckerScanning } from '../core/domain/entities/checker-scanning.entity';
import { InboundPlan } from 'src/core/domain/entities/inbound-plan.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InboundDeliveryOrder } from 'src/core/domain/entities/inbound-delivery-order.entity';
import { InboundDeliveryOrderItem } from 'src/core/domain/entities/inbound-delivery-order-item.entity';
import { MasterItem } from 'src/core/domain/entities/master-item.entity';

@Injectable()
export class CheckerScanningService {
  constructor(private readonly repository: CheckerScanningRepository,
    @InjectRepository(InboundPlan)
    private readonly inboundPlanRepository: Repository<InboundPlan>,
    @InjectRepository(InboundDeliveryOrder)
    private readonly inboundDeliveryOrderRepository: Repository<InboundDeliveryOrder>,
    @InjectRepository(InboundDeliveryOrderItem)
    private readonly inboundDeliveryOrderItemRepository: Repository<InboundDeliveryOrderItem>,
    @InjectRepository(MasterItem)
    private readonly masterItemRepository: Repository<MasterItem>,
  ) {}
  
  async create(createCheckerScanningDto: CreateCheckerScanningDto): Promise<CreateCheckerScanningDto> {
    const inboundPlan = await this.inboundPlanRepository.findOne({ where: { id: createCheckerScanningDto.inbound_plan_id } });
    if (!inboundPlan) {
      throw new NotFoundException('Inbound plan not found');
    }
    const inboundDeliveryOrder = await this.inboundDeliveryOrderRepository.findOne({ where: { id: createCheckerScanningDto.inbound_delivery_order_id } });
    if (!inboundDeliveryOrder) {
      throw new NotFoundException('Inbound delivery order not found');
    }
    const existingScanning = await this.repository.findByInboundDeliveryOrderItemId(createCheckerScanningDto.inbound_delivery_order_item_id);
    if (existingScanning) {
      const totalExistingScanning = existingScanning.reduce((acc, curr) => acc + curr.actual_qty, 0);
      const totalScannedQuantity = totalExistingScanning + createCheckerScanningDto.actual_qty;
      const totalQuantity = await this.inboundDeliveryOrderItemRepository.findOne({ where: { id: createCheckerScanningDto.inbound_delivery_order_item_id } });
      if (!totalQuantity) {
        throw new NotFoundException('Inbound delivery order item not found');
      }
      if (totalScannedQuantity >= totalQuantity.qty_plan) {
        const item = await this.masterItemRepository.findOne({ where: { id: createCheckerScanningDto.item_id } });
        if (!item) {
          throw new NotFoundException('Item not found');
        }
        throw new ConflictException(`Checker scanning with inbound delivery order item number ${inboundDeliveryOrder.number_delivery_order} ${item.sku} already full scanned`);
      }
    }
    await this.repository.create(createCheckerScanningDto);
    return createCheckerScanningDto;
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

  async approve(id: string, approved_by: string): Promise<CheckerScanning> {
    const checkerScanning = await this.repository.findOne(id);
    if (!checkerScanning) {
      throw new NotFoundException(`Checker scanning with ID ${id} not found`);
    }
    checkerScanning.status = 'Approved';
    checkerScanning.approved_by = approved_by;
    await this.repository.update(id, checkerScanning);
    return checkerScanning;
  }
}
