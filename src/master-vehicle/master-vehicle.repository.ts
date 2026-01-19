import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterVehicle } from '../core/domain/entities/master-vehicle.entity';
import { CreateVehicleIODto } from './dto/create-vehicle.dto';
import { UpdateVehicleIODto } from './dto/update-vehicle.dto';

@Injectable()
export class MasterVehicleRepository {
  constructor(
    @InjectRepository(MasterVehicle)
    private readonly repository: Repository<MasterVehicle>,
  ) {}

  async create(createVehicleIODto: CreateVehicleIODto): Promise<MasterVehicle> {
    const vehicle = this.repository.create(createVehicleIODto);
    return await this.repository.save(vehicle);
  }

  async findAll(): Promise<MasterVehicle[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterVehicle | null> {
    const vehicle = await this.repository.findOne({ where: { id } });
    if (!vehicle) {
      return null;
    }
    return vehicle;
  }

  async findByVehicleType(vehicle_type: string): Promise<MasterVehicle | null> {
    const vehicle = await this.repository.findOne({ where: { vehicle_type } });
    if (!vehicle) {
      return null;
    }
    return vehicle;
  }

  async update(id: string, updateVehicleIODto: UpdateVehicleIODto): Promise<MasterVehicle | null> {
    const vehicle = await this.findOne(id);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    await this.repository.update(id, updateVehicleIODto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    await this.repository.delete(id);
  }
}
