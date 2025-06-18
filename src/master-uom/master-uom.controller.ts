import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterUomService } from './master-uom.service';
import { CreateMasterUomDto } from './dto/create-master-uom.dto';
import { UpdateMasterUomDto } from './dto/update-master-uom.dto';
import { MasterUom } from '../core/domain/entities/master-uom.entity';

@ApiTags('Master UOM')
@Controller('master-uom')
@ApiBearerAuth('JWT-auth')
export class MasterUomController {
  constructor(private readonly masterUomService: MasterUomService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new UOM' })
  @ApiResponse({ status: 201, description: 'The UOM has been successfully created.', type: MasterUom })
  @ApiResponse({ status: 409, description: 'UOM with this code already exists.' })
  create(@Body() createMasterUomDto: CreateMasterUomDto) {
    return this.masterUomService.create(createMasterUomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all UOMs' })
  @ApiResponse({ status: 200, description: 'Return all UOMs.', type: [MasterUom] })
  findAll() {
    return this.masterUomService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a UOM by id' })
  @ApiResponse({ status: 200, description: 'Return the UOM.', type: MasterUom })
  @ApiResponse({ status: 404, description: 'UOM not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.masterUomService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a UOM' })
  @ApiResponse({ status: 200, description: 'The UOM has been successfully updated.', type: MasterUom })
  @ApiResponse({ status: 404, description: 'UOM not found.' })
  @ApiResponse({ status: 409, description: 'UOM with this code already exists.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMasterUomDto: UpdateMasterUomDto,
  ) {
    return this.masterUomService.update(id, updateMasterUomDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a UOM' })
  @ApiResponse({ status: 200, description: 'The UOM has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'UOM not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.masterUomService.remove(id);
  }
} 