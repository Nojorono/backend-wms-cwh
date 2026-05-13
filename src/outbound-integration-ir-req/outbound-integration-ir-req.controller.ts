import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OutboundIntegrationIrReq } from '../core/domain/entities/outbound-integration-ir-req.entity';
import { OutboundIntegrationIrReqLines } from '../core/domain/entities/outbound-integration-ir-req-lines.entity';
import { CreateOutboundIntegrationIrReqLineDto } from './dto/create-outbound-integration-ir-req-line.dto';
import { UpdateOutboundIntegrationIrReqLineDto } from './dto/update-outbound-integration-ir-req-line.dto';
import { OutboundIntegrationIrReqService } from './outbound-integration-ir-req.service';
import { CreateOutboundIntegrationIrReqPayloadDto } from './dto/create-outbound-integration-ir-req-payload.dto';
import { UpdateOutboundIntegrationIrReqPayloadDto } from './dto/update-outbound-integration-ir-req-payload.dto';
import { OutboundIntegrationIrReqHeaderWithLines } from './outbound-integration-ir-req.service';

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
  @ApiOperation({ summary: 'List outbound integration IR req headers with lines' })
  @ApiResponse({ status: 200 })
  findAllHeaders(): Promise<OutboundIntegrationIrReqHeaderWithLines[]> {
    return this.service.findAllHeaders();
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
