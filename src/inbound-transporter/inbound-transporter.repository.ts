import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundTransporter } from '../core/domain/entities/inbound-transporter.entity';
import { CreateInboundTransporterDto } from './dto/create-inbound-transporter.dto';
import { UpdateInboundTransporterDto } from './dto/update-inbound-transporter.dto';
import { MasterVehicle } from '../core/domain/entities/master-vehicle.entity';

@Injectable()
export class InboundTransporterRepository {
  constructor(
    @InjectRepository(InboundTransporter)
    private readonly repository: Repository<InboundTransporter>,
    @InjectRepository(MasterVehicle)
    private readonly vehicleRepository: Repository<MasterVehicle>,
  ) {}

  async create(createInboundTransporterDto: CreateInboundTransporterDto): Promise<InboundTransporter> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id: createInboundTransporterDto.vehicle_id } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    const inboundTransporter = this.repository.create({
      vehicle: vehicle,
      ...createInboundTransporterDto,
    });
    return await this.repository.save(inboundTransporter);
  }

  async findAll(): Promise<InboundTransporter[]> {
    return await this.repository.find({ relations: ['vehicle'] });
  }

  async findOne(id: string): Promise<InboundTransporter | null> {
    const inboundTransporter = await this.repository.findOne({ where: { id }, relations: ['vehicle'] });
    if (!inboundTransporter) {
      return null;
    }
    return inboundTransporter;
  }

  async findByInboundPlanId(inbound_plan_id: string): Promise<InboundTransporter[]> {
    const inboundTransporter = await this.repository.find({ where: { inbound_plan_id }, relations: ['vehicle'] });
    if (!inboundTransporter) {
      return [];
    }
    return inboundTransporter;
  }

  async update(id: string, updateInboundTransporterDto: UpdateInboundTransporterDto): Promise<InboundTransporter | null> {
    const inboundTransporter = await this.findOne(id);
    if (!inboundTransporter) {
      throw new NotFoundException('Inbound Transporter not found');
    }
    const vehicle = updateInboundTransporterDto.vehicle_id ? await this.vehicleRepository.findOne({ where: { id: updateInboundTransporterDto.vehicle_id } }) : inboundTransporter.vehicle;
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    await this.repository.update(id, {
      ...updateInboundTransporterDto,
      vehicle: vehicle,
    });
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const inboundTransporter = await this.findOne(id);
    if (!inboundTransporter) {
      throw new NotFoundException('Inbound Transporter not found');
    }
    await this.repository.delete(id);
  }
}
