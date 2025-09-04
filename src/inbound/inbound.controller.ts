import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiExtraModels, ApiBody } from '@nestjs/swagger';
import { InboundService } from './inbound.service';
import { CreateInboundDto, CreateInboundDoDto, CreateInboundItemDto } from './dto/create-inbound.dto';
import { UpdateInboundDto } from './dto/update-inbound.dto';
import { Inbound } from '../core/domain/entities/inbound.entity';

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
  @ApiOperation({ summary: 'List all inbounds' })
  @ApiResponse({ status: 200, type: [Inbound] })
  findAll() {
    return this.service.findAll();
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
}

