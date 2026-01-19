import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterIOService } from './master-io.service';
import { CreateMasterIODto } from './dto/create-master-io.dto';
import { UpdateMasterIODto } from './dto/update-master-io.dto';
import { MasterIO } from '../core/domain/entities/master-io.entity';

@ApiTags('Master IO')
@Controller('master-io')
@ApiBearerAuth('JWT-auth')
export class MasterIOController {
  constructor(private readonly masterIOService: MasterIOService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new IO' })
  @ApiResponse({
    status: 201,
    description: 'The IO has been successfully created.',
    type: MasterIO,
  })
  @ApiResponse({
    status: 409,
    description: 'IO with this code already exists.',
  })
  create(@Body() createMasterIODto: CreateMasterIODto) {
    return this.masterIOService.create(createMasterIODto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all UOMs' })
  @ApiResponse({
    status: 200,
    description: 'Return all IOs.',
    type: [MasterIO],
  })
  findAll() {
    return this.masterIOService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a IO by id' })
  @ApiResponse({ status: 200, description: 'Return the IO.', type: MasterIO })
  @ApiResponse({ status: 404, description: 'IO not found.' })
  findOne(@Param('id') id: string) {
    return this.masterIOService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a IO' })
  @ApiResponse({
    status: 200,
    description: 'The IO has been successfully updated.',
    type: MasterIO,
  })
  @ApiResponse({ status: 404, description: 'IO not found.' })
  @ApiResponse({
    status: 409,
    description: 'IO with this code already exists.',
  })
  update(@Param('id') id: string, @Body() updateMasterIODto: UpdateMasterIODto) {
    return this.masterIOService.update(id, updateMasterIODto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a IO' })
  @ApiResponse({
    status: 200,
    description: 'The IO has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'IO not found.' })
  remove(@Param('id') id: string) {
    return this.masterIOService.remove(id);
  }
}
