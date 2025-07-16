import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterSourceService } from './master-source.service';
import { CreateMasterSourceDto } from './dto/create-master-source.dto';
import { UpdateMasterSourceDto } from './dto/update-master-source.dto';
import { MasterSource } from '../core/domain/entities/master-source.entity';

@ApiTags('Master Source')
@Controller('master-source')
@ApiBearerAuth('JWT-auth')
export class MasterSourceController {
  constructor(private readonly masterSourceService: MasterSourceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Source' })
  @ApiResponse({ status: 201, description: 'The Source has been successfully created.', type: MasterSource })
  @ApiResponse({ status: 409, description: 'Source with this code already exists.' })
  create(@Body() createMasterSourceDto: CreateMasterSourceDto) {
    return this.masterSourceService.create(createMasterSourceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Sources' })
  @ApiResponse({ status: 200, description: 'Return all Sources.', type: [MasterSource] })
  findAll() {
      return this.masterSourceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Source by id' })
  @ApiResponse({ status: 200, description: 'Return the Source.', type: MasterSource })
  @ApiResponse({ status: 404, description: 'Source not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.masterSourceService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Source' })
  @ApiResponse({ status: 200, description: 'The Source has been successfully updated.', type: MasterSource })
  @ApiResponse({ status: 404, description: 'Source not found.' })
  @ApiResponse({ status: 409, description: 'Source with this code already exists.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMasterSourceDto: UpdateMasterSourceDto,
  ) {
    return this.masterSourceService.update(id, updateMasterSourceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Source' })
  @ApiResponse({ status: 200, description: 'The Source has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Source not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.masterSourceService.remove(id);
  }
} 