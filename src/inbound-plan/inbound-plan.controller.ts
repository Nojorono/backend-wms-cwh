import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InboundPlanService } from './inbound-plan.service';
import { CreateInboundPlanDto } from './dto/create-inbound-plan.dto';
import { UpdateInboundPlanDto } from './dto/update-inbound-plan.dto';
import { InboundPlan } from '../core/domain/entities/inbound-plan.entity';

@ApiTags('Inbound Plan')
@Controller('inbound-plan')
@ApiBearerAuth('JWT-auth')
export class InboundPlanController {
  constructor(private readonly inboundPlanService: InboundPlanService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Inbound Plan' })
  @ApiResponse({ status: 201, description: 'The Inbound Plan has been successfully created.', type: InboundPlan })
  @ApiResponse({ status: 409, description: 'Inbound Plan with this code already exists.' })
  create(@Body() createInboundPlanDto: CreateInboundPlanDto) {
    return this.inboundPlanService.create(createInboundPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Inbound Plans' })
  @ApiResponse({ status: 200, description: 'Return all Inbound Plans.', type: [InboundPlan] })
  findAll() {
    return this.inboundPlanService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Inbound Plan by id' })
  @ApiResponse({ status: 200, description: 'Return the Inbound Plan.', type: InboundPlan })
  @ApiResponse({ status: 404, description: 'Inbound Plan not found.' })
  findOne(@Param('id') id: string) {
    return this.inboundPlanService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Inbound Plan' })
  @ApiResponse({ status: 200, description: 'The Inbound Plan has been successfully updated.', type: InboundPlan })
  @ApiResponse({ status: 404, description: 'Inbound Plan not found.' })
  @ApiResponse({ status: 409, description: 'Inbound Plan with this code already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateInboundPlanDto: UpdateInboundPlanDto,
  ) {
    return this.inboundPlanService.update(id, updateInboundPlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Inbound Plan' })
  @ApiResponse({ status: 200, description: 'The Inbound Plan has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Inbound Plan not found.' })
  remove(@Param('id') id: string) {
    return this.inboundPlanService.remove(id);
  }

  @Get('update-inbound-plan-status-in-progress/:id')
  @ApiOperation({ summary: 'Update Inbound Plan Status in Progress' })
  @ApiResponse({ status: 200, description: 'Return the Inbound Plan status in progress.', type: InboundPlan })
  @ApiResponse({ status: 404, description: 'Inbound Plan not found.' })
  updateInboundPlanStatusInProgress(@Param('id') id: string) {
    return this.inboundPlanService.updateInboundPlanStatusInProgress(id);
  }
} 