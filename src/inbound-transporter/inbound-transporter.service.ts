import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InboundTransporterRepository } from './inbound-transporter.repository';
import { CreateInboundTransporterDto } from './dto/create-inbound-transporter.dto';
import { UpdateInboundTransporterDto } from './dto/update-inbound-transporter.dto';
import { InboundTransporter } from '../core/domain/entities/inbound-transporter.entity';

@Injectable()
export class InboundTransporterService {
  constructor(private readonly repository: InboundTransporterRepository) {}

  async create(createInboundTransporterDto: CreateInboundTransporterDto): Promise<InboundTransporter> {
    return await this.repository.create(createInboundTransporterDto);
  }

  async findAll(): Promise<InboundTransporter[]> {
    return await this.repository.findAll();
  }

  async findById(id: string): Promise<InboundTransporter> {
    const inboundTransporter = await this.repository.findOne(id);
    if (!inboundTransporter) {
      throw new NotFoundException(`Inbound Transporter with ID ${id} not found`);
    }
    return inboundTransporter;
  }

  async findByInboundPlanId(inbound_plan_id: string): Promise<InboundTransporter[]> {
    const inboundTransporter = await this.repository.findByInboundPlanId(inbound_plan_id);
    if (!inboundTransporter) {
      throw new NotFoundException(`Inbound Transporter with inbound plan code ${inbound_plan_id} not found`);
    }
    return inboundTransporter;
  }

  async update(inbound_plan_id: string, updateInboundTransporterDto: UpdateInboundTransporterDto): Promise<InboundTransporter> {
    const inboundTransporter = await this.repository.findOne(inbound_plan_id);
    if (!inboundTransporter) {
      throw new NotFoundException(`Inbound Transporter with ID ${inbound_plan_id} not found`);
    }
    const updatedInboundTransporter = await this.repository.update(inboundTransporter.id, updateInboundTransporterDto);
    if (!updatedInboundTransporter) {
      throw new NotFoundException(`Inbound Transporter with ID ${inbound_plan_id} not found`);
    }
    return updatedInboundTransporter;
  }

  async remove(id: string): Promise<void> {
    await this.repository.findOne(id);
    await this.repository.remove(id);
  }
}
