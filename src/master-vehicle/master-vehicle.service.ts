import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MasterVehicleRepository } from './master-vehicle.repository';
import { CreateVehicleIODto } from './dto/create-vehicle.dto';
import { UpdateVehicleIODto } from './dto/update-vehicle.dto';
import { MasterVehicle } from '../core/domain/entities/master-vehicle.entity';

@Injectable()
export class MasterVehicleService {
  constructor(private readonly repository: MasterVehicleRepository) {}

  async create(createVehicleIODto: CreateVehicleIODto): Promise<MasterVehicle> {
    const vehicleType = createVehicleIODto.vehicle_type;
    if (!vehicleType) {
      throw new BadRequestException('Vehicle Type is required');
    }
    const existingVehicle = await this.repository.findByVehicleType(vehicleType);
    if (existingVehicle) {
      throw new ConflictException(
        `Vehicle with type ${createVehicleIODto.vehicle_type} already exists`,
      );
    }
    return await this.repository.create(createVehicleIODto);
  }

  async findAll(): Promise<MasterVehicle[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterVehicle> {
    const vehicle = await this.repository.findOne(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async update(id: string, updateVehicleIODto: UpdateVehicleIODto): Promise<MasterVehicle> {
    const vehicle = await this.findOne(id);
    if (
      updateVehicleIODto.vehicle_type &&
      updateVehicleIODto.vehicle_type !== vehicle.vehicle_type
    ) {
      const existingVehicle = await this.repository.findByVehicleType(
        updateVehicleIODto.vehicle_type,
      );
      if (existingVehicle) {
        throw new ConflictException(
          `Vehicle with type ${updateVehicleIODto.vehicle_type} already exists`,
        );
      }
    }
    const updatedVehicle = await this.repository.update(id, updateVehicleIODto);
    if (!updatedVehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return updatedVehicle;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
