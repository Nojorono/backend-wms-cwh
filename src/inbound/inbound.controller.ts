import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiExtraModels, ApiBody, ApiQuery } from '@nestjs/swagger';
import { InboundService } from './inbound.service';
import { CreateInboundDto, CreateInboundDoDto, CreateInboundItemDto } from './dto/create-inbound.dto';
import { UpdateInboundDto, UpdateInboundStatusDto  } from './dto/update-inbound.dto';
import { Inbound } from '../core/domain/entities/inbound.entity';
import { InboundPaginationQueryDto } from './dto/inbound-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@ApiTags('Inbound')
@Controller('inbound')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(CreateInboundDoDto, CreateInboundItemDto)
export class InboundController {
  constructor(private readonly service: InboundService) {}

  @Post()
  @ApiOperation({ summary: 'Create inbound with optional DOs and Items' })
  @ApiResponse({ status: 201, type: Inbound })
  @ApiBody({ type: CreateInboundDto })
  create(@Body() dto: CreateInboundDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all inbounds with pagination' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'status',
      description: 'Filter inbounds by status',
      example: 'CREATED',
    },
  ])
  @ApiResponse({ status: 200, type: PaginatedResponseDto<Inbound> })
  findAll(@Query() paginationQuery: InboundPaginationQueryDto) {
    return this.service.findAllPaginated(paginationQuery);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inbound by id' })
  @ApiResponse({ status: 200, type: Inbound })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inbound fields' })
  @ApiResponse({ status: 200, type: Inbound })
  @ApiBody({ type: UpdateInboundDto })
  update(@Param('id') id: string, @Body() dto: UpdateInboundDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inbound' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // update status
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inbound status' })
  @ApiResponse({ status: 200, type: Inbound })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInboundStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}

