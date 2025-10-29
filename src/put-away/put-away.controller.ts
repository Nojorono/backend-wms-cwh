import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePutAwayDto, UpdatePutAwayDto } from './dto/create-put-away.dto';
import { CreateManyPutAwayDto } from './dto/create-many-put-away.dto';
import { PutAwayTransaction } from '../core/domain/entities/transaction-put-away.entity';
import { PutAwayService } from './put-away.service';

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

  @Post('create-many')
  @ApiOperation({ summary: 'Create multiple put away records' })
  @ApiResponse({ status: 201, description: 'Created', type: [PutAwayTransaction] })
  createMany(@Body() dto: CreateManyPutAwayDto) {
    return this.service.createMany(dto);
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

  @Get('find-task/:driver_id')
  @ApiOperation({ summary: 'Get Put Away task by driver id' })
  @ApiResponse({ status: 200, description: 'OK', type: [PutAwayTransaction] })
  findTaskByDriverId(@Param('driver_id') driver_id: string) {
    return this.service.findTaskByDriverId(driver_id);
  }

  @Get('find-task-history/:driver_id')
  @ApiOperation({ summary: 'Get Put Away task history by driver id' })
  @ApiResponse({ status: 200, description: 'OK', type: [PutAwayTransaction] })
  findTaskHistoryByDriverId(@Param('driver_id') driver_id: string) {
    return this.service.findTaskHistoryByDriverId(driver_id);
  }

  @Post('task-completed/:id')
  @ApiOperation({ summary: 'Confirm completed Put Away task by id' })
  @ApiResponse({ status: 200, description: 'Completed' })
  @ApiResponse({ status: 404, description: 'Not found' })
  taskCompleted(@Param('id') id: string) {
    return this.service.taskCompleted(id);
  }
}
