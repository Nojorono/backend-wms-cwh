import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OutboundIntegrationDeliveries } from '../core/domain/entities/outbound-integration-deliveries.entity';
import { CreateOutboundIntegrationDeliveriesDto } from './dto/create-outbound-integration-deliveries.dto';
import { UpdateOutboundIntegrationDeliveriesDto } from './dto/update-outbound-integration-deliveries.dto';
import { PollShipConfirmStatusResponseDto } from './dto/poll-ship-confirm-status-response.dto';
import { OutboundIntegrationDeliveriesService } from './outbound-integration-deliveries.service';

@ApiTags('Outbound Integration Deliveries')
@ApiBearerAuth('JWT-auth')
@Controller('outbound-integration-deliveries')
export class OutboundIntegrationDeliveriesController {
  constructor(private readonly service: OutboundIntegrationDeliveriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create outbound integration delivery record' })
  @ApiResponse({ status: 201, type: OutboundIntegrationDeliveries })
  create(@Body() dto: CreateOutboundIntegrationDeliveriesDto): Promise<OutboundIntegrationDeliveries> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all outbound integration delivery records' })
  @ApiResponse({ status: 200, type: [OutboundIntegrationDeliveries] })
  findAll(): Promise<OutboundIntegrationDeliveries[]> {
    return this.service.findAll();
  }

  @Get('outbound-do/:outboundDoId')
  @ApiOperation({ summary: 'List delivery records by outbound DO ID' })
  @ApiResponse({ status: 200, type: [OutboundIntegrationDeliveries] })
  findByOutboundDoId(
    @Param('outboundDoId') outboundDoId: string,
  ): Promise<OutboundIntegrationDeliveries[]> {
    return this.service.findByOutboundDoId(outboundDoId);
  }

  @Get('poll-status/outbound-do/:outboundDoId')
  @ApiOperation({
    summary: 'Poll Oracle ship confirm / pick release status and sync to WMS',
    description:
      'Calls shipconfirm.find per source_header_id (memo.id for subdist, IR header id for internal), ' +
      'updates create/update/pick_release/ship_confirm status fields on outbound_integration_deliveries.',
  })
  @ApiResponse({ status: 200, type: PollShipConfirmStatusResponseDto })
  @ApiResponse({ status: 404, description: 'No integration deliveries for this outbound DO' })
  pollStatusByOutboundDoId(
    @Param('outboundDoId') outboundDoId: string,
  ): Promise<PollShipConfirmStatusResponseDto> {
    return this.service.pollStatusByOutboundDoId(outboundDoId);
  }

  @Get('outbound-memo/:outboundMemoId')
  @ApiOperation({ summary: 'List delivery records by outbound memo ID' })
  @ApiResponse({ status: 200, type: [OutboundIntegrationDeliveries] })
  findByOutboundMemoId(
    @Param('outboundMemoId') outboundMemoId: string,
  ): Promise<OutboundIntegrationDeliveries[]> {
    return this.service.findByOutboundMemoId(outboundMemoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get outbound integration delivery by ID' })
  @ApiResponse({ status: 200, type: OutboundIntegrationDeliveries })
  findOne(@Param('id') id: string): Promise<OutboundIntegrationDeliveries> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update outbound integration delivery by ID' })
  @ApiResponse({ status: 200, type: OutboundIntegrationDeliveries })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOutboundIntegrationDeliveriesDto,
  ): Promise<OutboundIntegrationDeliveries> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete outbound integration delivery by ID' })
  @ApiResponse({ status: 200 })
  async remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    await this.service.remove(id);
    return { success: true, message: 'Outbound integration delivery deleted' };
  }
}
