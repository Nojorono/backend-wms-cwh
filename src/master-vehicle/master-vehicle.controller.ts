import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterVehicleService } from './master-vehicle.service';
import { CreateVehicleIODto } from './dto/create-vehicle.dto';
import { UpdateVehicleIODto } from './dto/update-vehicle.dto';
import { MasterVehicle } from '../core/domain/entities/master-vehicle.entity';

@ApiTags('Master Vehicle')
@Controller('master-vehicle')
@ApiBearerAuth('JWT-auth')
export class MasterVehicleController {
  constructor(private readonly masterVehicleService: MasterVehicleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Vehicle' })
  @ApiResponse({ status: 201, description: 'The Vehicle has been successfully created.', type: MasterVehicle })
  @ApiResponse({ status: 409, description: 'Vehicle with this type already exists.' })
  create(@Body() createVehicleIODto: CreateVehicleIODto) {
    return this.masterVehicleService.create(createVehicleIODto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Vehicles' })
  @ApiResponse({ status: 200, description: 'Return all Vehicles.', type: [MasterVehicle] })
  findAll() {
    return this.masterVehicleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Vehicle by id' })
  @ApiResponse({ status: 200, description: 'Return the Vehicle.', type: MasterVehicle })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  findOne(@Param('id') id: string) {
    return this.masterVehicleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Vehicle' })
  @ApiResponse({ status: 200, description: 'The Vehicle has been successfully updated.', type: MasterVehicle })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  @ApiResponse({ status: 409, description: 'Vehicle with this type already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateVehicleIODto: UpdateVehicleIODto,
  ) {
    return this.masterVehicleService.update(id, updateVehicleIODto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Vehicle' })
  @ApiResponse({ status: 200, description: 'The Vehicle has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  remove(@Param('id') id: string) {
    return this.masterVehicleService.remove(id);
  }
} 