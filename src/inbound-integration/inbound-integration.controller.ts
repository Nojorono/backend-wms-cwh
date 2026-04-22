import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InboundIntegration } from 'src/core/domain/entities/inbound-integration.entity';
import { InboundIntegrationLines } from 'src/core/domain/entities/inbound-integration-lines.entity';
import { CreateInboundIntegrationDto } from './dto/create-inbound-integration.dto';
import { UpdateInboundIntegrationDto } from './dto/update-inbound-integration.dto';
import { CreateInboundIntegrationLineDto } from './dto/create-inbound-integration-line.dto';
import { UpdateInboundIntegrationLineDto } from './dto/update-inbound-integration-line.dto';
import { InboundIntegrationService } from './inbound-integration.service';
import { CreateInboundIntegrationPayloadDto } from './dto/create-inbound-integration-payload.dto';
import { UpdateInboundIntegrationPayloadDto } from './dto/update-inbound-integration-payload.dto';
import { InboundIntegrationHeaderWithLines } from './inbound-integration.service';

@ApiTags('Inbound Integration')
@ApiBearerAuth('JWT-auth')
@Controller('inbound-integration')
export class InboundIntegrationController {
  constructor(private readonly service: InboundIntegrationService) {}

  @Post()
  @ApiOperation({ summary: 'Create inbound integration header with optional lines' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateInboundIntegrationPayloadDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List inbound integration headers' })
  @ApiResponse({ status: 200 })
  findAllHeaders(): Promise<InboundIntegrationHeaderWithLines[]> {
    return this.service.findAllHeaders();
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
