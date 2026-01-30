import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExtraModels,
} from '@nestjs/swagger';
import { InboundReturService } from './inbound-retur.service';
import { CreateInboundReturDto } from './dto/create-inbound-retur.dto';
import { UpdateInboundReturDto, UpdateInboundReturStatusDto } from './dto/update-inbound-retur.dto';
import { InboundReturPaginationQueryDto } from './dto/inbound-retur-pagination.dto';
import { InboundRetur } from '../core/domain/entities/inbound-retur.entity';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { CreateInboundReturHelperDto } from './dto/create-inbound-retur-helper.dto';
import { CreateInboundReturItemDto } from './dto/create-inbound-retur-item.dto';
import { InboundReturHelper } from 'src/core/domain/entities/inbound-retur-helper.entity';

@ApiTags('Inbound Retur')
@Controller('inbound-retur')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(CreateInboundReturHelperDto, CreateInboundReturItemDto)
export class InboundReturController {
  constructor(private readonly service: InboundReturService) { }

  @Post()
  @ApiOperation({ summary: 'Create inbound retur with optional helpers and items' })
  @ApiResponse({ status: 201, description: 'Created', type: InboundRetur })
  @ApiBody({ type: CreateInboundReturDto })
  create(@Body() dto: CreateInboundReturDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all inbound retur or search with pagination' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'status',
      description: 'Filter inbound retur by status',
      example: 'CREATED',
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Return all inbound retur or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/InboundRetur' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findAll(@Query() paginationQuery: InboundReturPaginationQueryDto) {
    const hasPaginationParams =
      !!paginationQuery.search ||
      !!paginationQuery.page ||
      !!paginationQuery.limit ||
      !!paginationQuery.sortBy ||
      !!paginationQuery.sortOrder ||
      !!paginationQuery.status;

    if (hasPaginationParams) {
      return this.service.findAllPaginated(paginationQuery);
    }
    return this.service.findAll(paginationQuery.status);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all inbound retur (no pagination)' })
  @ApiResponse({ status: 200, description: 'OK', type: [InboundRetur] })
  findAllPlain(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inbound retur by id' })
  @ApiResponse({ status: 200, type: InboundRetur })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inbound retur' })
  @ApiResponse({ status: 200, type: InboundRetur })
  @ApiBody({ type: UpdateInboundReturDto })
  update(@Param('id') id: string, @Body() dto: UpdateInboundReturDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inbound retur status' })
  @ApiResponse({ status: 200, type: InboundRetur })
  @ApiBody({ type: UpdateInboundReturStatusDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInboundReturStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inbound retur (soft delete)' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('helpers')
  @ApiOperation({ summary: 'Create inbound retur helpers' })
  @ApiResponse({ status: 200, type: InboundReturHelper })
  @ApiBody({ type: CreateInboundReturHelperDto })
  createHelpers(@Body() dto: CreateInboundReturHelperDto) {
    return this.service.createHelpers(dto);
  }

  @Delete('helpers/:id')
  @ApiOperation({ summary: 'Delete inbound retur helper' })
  @ApiResponse({ status: 200, type: InboundReturHelper })
  deleteHelper(@Param('id') id: string) {
    return this.service.deleteHelper(id);
  }
}
