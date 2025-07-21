import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InboundTransporterService } from './inbound-transporter.service';
import { CreateInboundTransporterDto } from './dto/create-inbound-transporter.dto';
import { UpdateInboundTransporterDto } from './dto/update-inbound-transporter.dto';
import { InboundTransporter } from '../core/domain/entities/inbound-transporter.entity';

@ApiTags('Inbound Transporter')
@Controller('inbound-transporter')
@ApiBearerAuth('JWT-auth')
export class InboundTransporterController {
  constructor(private readonly inboundTransporterService: InboundTransporterService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Inbound Transporter' })
  @ApiResponse({ status: 201, description: 'The Inbound Transporter has been successfully created.', type: InboundTransporter })
  @ApiResponse({ status: 409, description: 'Inbound Transporter with this code already exists.' })
  create(@Body() createInboundTransporterDto: CreateInboundTransporterDto) {
    return this.inboundTransporterService.create(createInboundTransporterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Inbound Transporters' })
  @ApiResponse({ status: 200, description: 'Return all Inbound Transporters.', type: [InboundTransporter] })
  findAll() {
      return this.inboundTransporterService.findAll();
  }

  @Get(':inbound_plan_id')
  @ApiOperation({ summary: 'Get a Inbound Transporter by inbound plan id' })
  @ApiResponse({ status: 200, description: 'Return the Inbound Transporter.', type: InboundTransporter })
  @ApiResponse({ status: 404, description: 'Inbound Transporter not found.' })
  findByInboundPlanId(@Param('inbound_plan_id') inbound_plan_id: string) {
    return this.inboundTransporterService.findByInboundPlanId(inbound_plan_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Inbound Transporter by id' })
  @ApiResponse({ status: 200, description: 'Return the Inbound Transporter.', type: InboundTransporter })
  @ApiResponse({ status: 404, description: 'Inbound Transporter not found.' })
  findOne(@Param('id') id: string) {
    return this.inboundTransporterService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Inbound Transporter' })
  @ApiResponse({ status: 200, description: 'The Inbound Transporter has been successfully updated.', type: InboundTransporter })
  @ApiResponse({ status: 404, description: 'Inbound Transporter not found.' })
  @ApiResponse({ status: 409, description: 'Inbound Transporter with this code already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateInboundTransporterDto: UpdateInboundTransporterDto,
  ) {
    return this.inboundTransporterService.update(id, updateInboundTransporterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Inbound Transporter' })
  @ApiResponse({ status: 200, description: 'The Inbound Transporter has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Inbound Transporter not found.' })
  remove(@Param('id') id: string) {
    return this.inboundTransporterService.remove(id);
  }
} 