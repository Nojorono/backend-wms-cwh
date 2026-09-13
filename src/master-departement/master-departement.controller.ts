import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterDepartementService } from './master-departement.service';
import { CreateMasterDepartementDto } from './dto/create-master-departement.dto';
import { UpdateMasterDepartementDto } from './dto/update-master-departement.dto';
import { MasterDepartement } from '../core/domain/entities/matser-departement.entity';

@ApiTags('Master Departement')
@Controller('master-departement')
@ApiBearerAuth('JWT-auth')
export class MasterDepartementController {
  constructor(private readonly masterDepartementService: MasterDepartementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Departement' })
  @ApiResponse({
    status: 201,
    description: 'The Departement has been successfully created.',
    type: MasterDepartement,
  })
  @ApiResponse({
    status: 409,
    description: 'Departement with this code already exists.',
  })
  create(@Body() createDto: CreateMasterDepartementDto) {
    return this.masterDepartementService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Departements' })
  @ApiResponse({
    status: 200,
    description: 'Return all Departements.',
    type: [MasterDepartement],
  })
  findAll() {
    return this.masterDepartementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Departement by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Departement.',
    type: MasterDepartement,
  })
  @ApiResponse({ status: 404, description: 'Departement not found.' })
  findOne(@Param('id') id: string) {
    return this.masterDepartementService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Departement' })
  @ApiResponse({
    status: 200,
    description: 'The Departement has been successfully updated.',
    type: MasterDepartement,
  })
  @ApiResponse({ status: 404, description: 'Departement not found.' })
  @ApiResponse({
    status: 409,
    description: 'Departement with this code already exists.',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateMasterDepartementDto) {
    return this.masterDepartementService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Departement' })
  @ApiResponse({
    status: 200,
    description: 'The Departement has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Departement not found.' })
  remove(@Param('id') id: string) {
    return this.masterDepartementService.remove(id);
  }
}
