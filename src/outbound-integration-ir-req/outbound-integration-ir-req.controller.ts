import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OutboundIntegrationIrReq } from '../core/domain/entities/outbound-integration-ir-req.entity';
import { OutboundIntegrationIrReqLines } from '../core/domain/entities/outbound-integration-ir-req-lines.entity';
import { CreateOutboundIntegrationIrReqLineDto } from './dto/create-outbound-integration-ir-req-line.dto';
import { UpdateOutboundIntegrationIrReqLineDto } from './dto/update-outbound-integration-ir-req-line.dto';
import { OutboundIntegrationIrReqService } from './outbound-integration-ir-req.service';
import { CreateOutboundIntegrationIrReqPayloadDto } from './dto/create-outbound-integration-ir-req-payload.dto';
import { UpdateOutboundIntegrationIrReqPayloadDto } from './dto/update-outbound-integration-ir-req-payload.dto';
import { PollIntegrationStatusResponseDto } from './dto/poll-integration-status-response.dto';
import { OutboundIntegrationIrReqHeaderWithLines } from './outbound-integration-ir-req.service';
import { OutboundIntegrationIrReqPaginationQueryDto } from './dto/outbound-integration-ir-req-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@ApiTags('Outbound Integration IR Req')
@ApiBearerAuth('JWT-auth')
@Controller('outbound-integration-ir-req')
export class OutboundIntegrationIrReqController {
  constructor(private readonly service: OutboundIntegrationIrReqService) {}

  @Post()
  @ApiOperation({ summary: 'Create outbound integration IR req header with optional lines' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateOutboundIntegrationIrReqPayloadDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List outbound integration IR req headers with lines (paginated)' })
  @ApiResponse({ status: 200 })
  findAllHeaders(
    @Query() query: OutboundIntegrationIrReqPaginationQueryDto,
  ): Promise<PaginatedResponseDto<OutboundIntegrationIrReqHeaderWithLines>> {
    return this.service.findAllHeadersPaginated(query);
  }

  @Get('poll-status/outbound-do/:outboundDoId')
  @ApiOperation({
    summary: 'Poll Oracle PO internal req status and sync to WMS',
    description:
      'Fetches latest Oracle iface status (IR/IO/OI + lines), updates outbound_integration_ir_req, ' +
      'and sets outbound_memo to INTEGRATED or FAILED when terminal.',
  })
  @ApiResponse({ status: 200, type: PollIntegrationStatusResponseDto })
  @ApiResponse({ status: 404, description: 'No integration IR req for this outbound DO' })
  pollStatusByOutboundDoId(
    @Param('outboundDoId') outboundDoId: string,
  ): Promise<PollIntegrationStatusResponseDto> {
    return this.service.pollStatusByOutboundDoId(outboundDoId);
  }

  @Post('lines')
  @ApiOperation({ summary: 'Create outbound integration IR req line' })
  @ApiResponse({ status: 201, type: OutboundIntegrationIrReqLines })
  createLine(@Body() dto: CreateOutboundIntegrationIrReqLineDto) {
    return this.service.createLine(dto);
  }

  @Get('lines/all')
  @ApiOperation({ summary: 'List all outbound integration IR req lines' })
  @ApiResponse({ status: 200, type: [OutboundIntegrationIrReqLines] })
  findAllLines() {
    return this.service.findAllLines();
  }

  @Get('lines/:id')
  @ApiOperation({ summary: 'Get outbound integration IR req line by ID' })
  @ApiResponse({ status: 200, type: OutboundIntegrationIrReqLines })
  findLineById(@Param('id') id: string) {
    return this.service.findLineById(id);
  }

  @Patch('lines/:id')
  @ApiOperation({ summary: 'Update outbound integration IR req line by ID' })
  @ApiResponse({ status: 200, type: OutboundIntegrationIrReqLines })
  updateLine(@Param('id') id: string, @Body() dto: UpdateOutboundIntegrationIrReqLineDto) {
    return this.service.updateLine(id, dto);
  }

  @Delete('lines/:id')
  @ApiOperation({ summary: 'Soft-delete outbound integration IR req line by ID' })
  @ApiResponse({ status: 200 })
  removeLine(@Param('id') id: string) {
    return this.service.removeLine(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get outbound integration IR req header by ID (with lines)' })
  @ApiResponse({ status: 200, type: OutboundIntegrationIrReq })
  findHeaderById(@Param('id') id: string) {
    return this.service.findHeaderWithLinesById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update header with optional line replacement' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() dto: UpdateOutboundIntegrationIrReqPayloadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete outbound integration IR req header and its lines' })
  @ApiResponse({ status: 200 })
  removeHeader(@Param('id') id: string) {
    return this.service.removeHeader(id);
  }
}
