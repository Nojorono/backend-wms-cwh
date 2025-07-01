import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckerScanningService } from './checker-scanning.service';
import { CreateCheckerScanningDto } from './dto/create-checker-scanning.dto';
import { UpdateCheckerScanningDto } from './dto/update-checker-scanning.dto';
import { CheckerScanning } from '../core/domain/entities/checker-scanning.entity';

@ApiTags('Checker Scanning')
@Controller('checker-scanning')
@ApiBearerAuth('JWT-auth')
export class CheckerScanningController {
  constructor(private readonly checkerScanningService: CheckerScanningService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Checker Scanning' })
  @ApiResponse({ status: 201, description: 'The Checker Scanning has been successfully created.', type: CheckerScanning })
  @ApiResponse({ status: 409, description: 'Checker Scanning with this code already exists.' })
  create(@Body() createCheckerScanningDto: CreateCheckerScanningDto) {
    return this.checkerScanningService.create(createCheckerScanningDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Checker Scanning' })
  @ApiResponse({ status: 200, description: 'Return all Checker Scanning.', type: [CheckerScanning] })
  findAll() {
      return this.checkerScanningService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Checker Scanning by id' })
  @ApiResponse({ status: 200, description: 'Return the Checker Scanning.', type: CheckerScanning })
  @ApiResponse({ status: 404, description: 'Checker Scanning not found.' })
  findOne(@Param('id') id: string) {
    return this.checkerScanningService.findOne(id);
  }

  @Get('inbound-plan/:inbound_plan_id')
  @ApiOperation({ summary: 'Get all Checker Scanning by inbound plan id' })
  @ApiResponse({ status: 200, description: 'Return all Checker Scanning by inbound plan id.', type: [CheckerScanning] })
  findByInboundPlanId(@Param('inbound_plan_id') inbound_plan_id: string) {
    return this.checkerScanningService.findByInboundPlanId(inbound_plan_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Checker Scanning' })
  @ApiResponse({ status: 200, description: 'The Checker Scanning has been successfully updated.', type: CheckerScanning })
  @ApiResponse({ status: 404, description: 'Checker Scanning not found.' })
  @ApiResponse({ status: 409, description: 'Checker Scanning with this code already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateCheckerScanningDto: UpdateCheckerScanningDto,
  ) {
    return this.checkerScanningService.update(id, updateCheckerScanningDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Checker Scanning' })
  @ApiResponse({ status: 200, description: 'The Checker Scanning has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Checker Scanning not found.' })
  remove(@Param('id') id: string) {
    return this.checkerScanningService.remove(id);
  }
} 