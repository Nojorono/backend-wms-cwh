import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePutAwayDto, UpdatePutAwayDto } from './dto/create-put-away.dto';
import { PutAwayTransaction } from '../core/domain/entities/transaction-put-away.entity';
import { PutAwayService } from './put-away.service';
import { InventoryTracking } from 'src/core/domain/entities/inventory-tracking.entity';


@ApiTags('Put Away')
@Controller('put-away')
@ApiBearerAuth('JWT-auth')
export class PutAwayController {
  constructor(private readonly service: PutAwayService) {}

  @Post()
  @ApiOperation({ summary: 'Create an put away record' })
  @ApiResponse({ status: 201, description: 'Created', type: PutAwayTransaction })
  create(@Body() dto: CreatePutAwayDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all put away records' })
  @ApiResponse({ status: 200, description: 'OK', type: [PutAwayTransaction] })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get put away by id' })
  @ApiResponse({ status: 200, description: 'OK', type: PutAwayTransaction })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update put away by id' })
  @ApiResponse({ status: 200, description: 'Updated', type: PutAwayTransaction })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdatePutAwayDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete put away by id' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
  //inventory tracking list with status INSPECTION_APPROVED for put away with suggestion destination
  @Get('inventory-inspected')
  @ApiOperation({ summary: 'Get inventory tracking list with status INSPECTION_APPROVED for put away with suggestion destination' })
  @ApiResponse({ status: 200, description: 'OK', type: [InventoryTracking] })
  suggestionDestinationIn() {
    // return this.service.suggestionDestinationIn();
  }
}


