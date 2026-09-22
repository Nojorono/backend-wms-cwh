import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ManagementUserFas } from '../core/domain/entities/management-user-fas.entity';
import { ManagementUserFasService } from './management-user-fas.service';
import { CreateManagementUserFasDto } from './dto/create-management-user-fas.dto';
import { UpdateManagementUserFasDto } from './dto/update-management-user-fas.dto';
import { ManagementUserFasPaginationQueryDto } from './dto/management-user-fas-pagination.dto';
import { ManagementUserFasGroupedByOrgDto } from './dto/management-user-fas-grouped.dto';

@ApiTags('Management User FAS')
@ApiBearerAuth('JWT-auth')
@Controller('management-user-fas')
export class ManagementUserFasController {
  constructor(private readonly service: ManagementUserFasService) {}

  @Post()
  @ApiOperation({ summary: 'Create management user FAS' })
  @ApiResponse({ status: 201, type: ManagementUserFas })
  @ApiResponse({ status: 409, description: 'Name or email already exists' })
  create(@Body() dto: CreateManagementUserFasDto): Promise<ManagementUserFas> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all management user FAS grouped by organization (m_io.id)',
  })
  @ApiResponse({ status: 200, type: [ManagementUserFasGroupedByOrgDto] })
  findAll(
    @Query() query: ManagementUserFasPaginationQueryDto,
  ): Promise<ManagementUserFasGroupedByOrgDto[]> {
    return this.service.findAllGroupedByOrganization(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get management user FAS by ID' })
  @ApiResponse({ status: 200, type: ManagementUserFas })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string): Promise<ManagementUserFas> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update management user FAS' })
  @ApiResponse({ status: 200, type: ManagementUserFas })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Name or email already exists' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateManagementUserFasDto,
  ): Promise<ManagementUserFas> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete management user FAS' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.service.remove(id);
  }
}
