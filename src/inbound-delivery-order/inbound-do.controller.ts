import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InboundDeliveryOrderService } from './inbound-do.service';
import { CreateInboundDeliveryOrderDto } from './dto/create-inbound-do.dto';
import { UpdateInboundDeliveryOrderDto } from './dto/update-inbound-do.dto';
import { InboundDeliveryOrder } from '../core/domain/entities/inbound-delivery-order.entity';

@ApiTags('Inbound Delivery Order')
@Controller('inbound-delivery-order')
@ApiBearerAuth('JWT-auth')
export class InboundDeliveryOrderController {
  constructor(private readonly inboundDeliveryOrderService: InboundDeliveryOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Inbound Delivery Order' })
  @ApiResponse({ status: 201, description: 'The Inbound Delivery Order has been successfully created.', type: InboundDeliveryOrder })
  @ApiResponse({ status: 409, description: 'Inbound Delivery Order with this code already exists.' })
  create(@Body() createInboundDeliveryOrderDto: CreateInboundDeliveryOrderDto) {
    return this.inboundDeliveryOrderService.create(createInboundDeliveryOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Inbound Delivery Orders' })
  @ApiResponse({ status: 200, description: 'Return all Inbound Delivery Orders.', type: [InboundDeliveryOrder] })
  findAll() {
    return this.inboundDeliveryOrderService.findAll();
  }

  @Get(':inbound_plan_id')
  @ApiOperation({ summary: 'Get a Inbound Delivery Order by inbound_plan_id' })
  @ApiResponse({ status: 200, description: 'Return the Inbound Delivery Order.', type: InboundDeliveryOrder })
  @ApiResponse({ status: 404, description: 'Inbound Delivery Order not found.' })
  findByInboundPlanId(@Param('inbound_plan_id') inbound_plan_id: string) {
    return this.inboundDeliveryOrderService.findByInboundPlanId(inbound_plan_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Inbound Delivery Order' })
  @ApiResponse({ status: 200, description: 'The Inbound Delivery Order has been successfully updated.', type: InboundDeliveryOrder })
  @ApiResponse({ status: 404, description: 'Inbound Delivery Order not found.' })
  @ApiResponse({ status: 409, description: 'Inbound Delivery Order with this code already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateInboundDeliveryOrderDto: UpdateInboundDeliveryOrderDto,
  ) {
    return this.inboundDeliveryOrderService.update(id, updateInboundDeliveryOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Inbound Delivery Order' })
  @ApiResponse({ status: 200, description: 'The Inbound Delivery Order has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Inbound Delivery Order not found.' })
  remove(@Param('id') id: string) {
    return this.inboundDeliveryOrderService.remove(id);
  }
} 