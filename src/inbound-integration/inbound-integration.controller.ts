import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InboundIntegration } from 'src/core/domain/entities/inbound-integration.entity';
import { InboundIntegrationLines } from 'src/core/domain/entities/inbound-integration-lines.entity';
import { CreateInboundIntegrationLineDto } from './dto/create-inbound-integration-line.dto';
import { UpdateInboundIntegrationLineDto } from './dto/update-inbound-integration-line.dto';
import { InboundIntegrationService } from './inbound-integration.service';
import { CreateInboundIntegrationPayloadDto } from './dto/create-inbound-integration-payload.dto';
import { UpdateInboundIntegrationPayloadDto } from './dto/update-inbound-integration-payload.dto';
import { InboundIntegrationHeaderWithLines } from './inbound-integration.service';
import { InboundIntegrationPollService } from './inbound-integration-poll.service';
import { InboundIntegrationPollResponseDto } from './dto/inbound-integration-poll-response.dto';
import { InboundIntegrationPaginationQueryDto } from './dto/inbound-integration-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@ApiTags('Inbound Integration')
@ApiBearerAuth('JWT-auth')
@Controller('inbound-integration')
export class InboundIntegrationController {
  constructor(
    private readonly service: InboundIntegrationService,
    private readonly pollService: InboundIntegrationPollService,
  ) {}
  @Post()
  @ApiOperation({ summary: 'Create inbound integration header with optional lines' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateInboundIntegrationPayloadDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List inbound integration headers with lines (paginated)' })
  @ApiResponse({ status: 200 })
  findAllHeaders(
    @Query() query: InboundIntegrationPaginationQueryDto,
  ): Promise<PaginatedResponseDto<InboundIntegrationHeaderWithLines>> {
    return this.service.findAllHeadersPaginated(query);
  }

  @Get('polling/inbound-do/:inboundDoId')
  @ApiOperation({
    summary: 'Poll Oracle and sync inbound integration status by inbound DO id',
    description:
      'Calls rcv-receipt.findBySourceHeaderId using source_header_id from the staging row for this inbound_do_id, updates header/lines, and returns current status.',
  })
  @ApiParam({ name: 'inboundDoId', description: 'Inbound DO UUID' })
  @ApiResponse({ status: 200, type: InboundIntegrationPollResponseDto })
  @ApiResponse({ status: 404, description: 'Inbound integration not found for this DO' })
  pollingByInboundDoId(
    @Param('inboundDoId') inboundDoId: string,
  ): Promise<InboundIntegrationPollResponseDto> {
    return this.pollService.pollByInboundDoId(inboundDoId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inbound integration header by ID' })
  @ApiResponse({ status: 200, type: InboundIntegration })
  findHeaderById(@Param('id') id: string) {
    return this.service.findHeaderById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inbound integration header with optional line replacement by ID' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() dto: UpdateInboundIntegrationPayloadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inbound integration header by ID' })
  @ApiResponse({ status: 200 })
  removeHeader(@Param('id') id: string) {
    return this.service.removeHeader(id);
  }

  @Post('lines')
  @ApiOperation({ summary: 'Create inbound integration line' })
  @ApiResponse({ status: 201, type: InboundIntegrationLines })
  createLine(@Body() dto: CreateInboundIntegrationLineDto) {
    return this.service.createLine(dto);
  }

  @Get('lines/all')
  @ApiOperation({ summary: 'List inbound integration lines' })
  @ApiResponse({ status: 200, type: [InboundIntegrationLines] })
  findAllLines() {
    return this.service.findAllLines();
  }

  @Get('lines/:id')
  @ApiOperation({ summary: 'Get inbound integration line by ID' })
  @ApiResponse({ status: 200, type: InboundIntegrationLines })
  findLineById(@Param('id') id: string) {
    return this.service.findLineById(id);
  }

  @Patch('lines/:id')
  @ApiOperation({ summary: 'Update inbound integration line by ID' })
  @ApiResponse({ status: 200, type: InboundIntegrationLines })
  updateLine(@Param('id') id: string, @Body() dto: UpdateInboundIntegrationLineDto) {
    return this.service.updateLine(id, dto);
  }

  @Delete('lines/:id')
  @ApiOperation({ summary: 'Delete inbound integration line by ID' })
  @ApiResponse({ status: 200 })
  removeLine(@Param('id') id: string) {
    return this.service.removeLine(id);
  }
}
