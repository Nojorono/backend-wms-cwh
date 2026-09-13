import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OutboundIntegrationDeliveries } from '../core/domain/entities/outbound-integration-deliveries.entity';
import { CreateOutboundIntegrationDeliveriesDto } from './dto/create-outbound-integration-deliveries.dto';
import { UpdateOutboundIntegrationDeliveriesDto } from './dto/update-outbound-integration-deliveries.dto';
import { PollShipConfirmStatusResponseDto } from './dto/poll-ship-confirm-status-response.dto';
import { PollShipConfirmByMemoQueryDto } from './dto/poll-ship-confirm-by-memo-query.dto';
import { OutboundIntegrationDeliveriesPaginationQueryDto } from './dto/outbound-integration-deliveries-pagination.dto';
import { OutboundIntegrationDeliveriesService } from './outbound-integration-deliveries.service';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

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
  @ApiOperation({ summary: 'List outbound integration delivery records (paginated)' })
  @ApiResponse({ status: 200 })
  findAll(
    @Query() query: OutboundIntegrationDeliveriesPaginationQueryDto,
  ): Promise<PaginatedResponseDto<OutboundIntegrationDeliveries>> {
    return this.service.findAllPaginated(query);
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
    summary: 'Poll Oracle ship confirm / pick release status by outbound DO',
    description:
      'Loads outbound_integration_deliveries for the outbound DO and transaction_type, then runs the same ' +
      'shipconfirm.find process as the background worker:\n' +
      '- OUTBOUND_GS_SO_SUBDIST_PICK_RELEASE → one find per delivery row using source_line_id ' +
      '(+ source_header_id / memo id + iso_header_id)\n' +
      '- OUTBOUND_GS_SO_SUBDIST_SHIP_CONFIRM → one find per delivery row using source_header_id + delivery_id only (no iso_header_id)\n' +
      '- OUTBOUND_GS_MUTASI_SO_INTERNAL → header-level find using source_header_id + iso_header_id\n' +
      'Each find result updates only the matching outbound_integration_deliveries row.',
  })
  @ApiResponse({ status: 200, type: PollShipConfirmStatusResponseDto })
  @ApiResponse({
    status: 404,
    description: 'No integration deliveries for this outbound DO and transaction_type',
  })
  pollStatusByOutboundDoId(
    @Param('outboundDoId') outboundDoId: string,
    @Query() query: PollShipConfirmByMemoQueryDto,
  ): Promise<PollShipConfirmStatusResponseDto> {
    return this.service.pollStatusByOutboundDoId(outboundDoId, query);
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
