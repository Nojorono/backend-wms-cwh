import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AssignedGateLoadService } from './assigned-gate-load.service';
import { CreateAssignedGateLoadDto } from '../assigned-gate/dto/create-assigned-gate-load.dto';
import { UpdateAssignedGateLoadDto } from '../assigned-gate/dto/update-assigned-gate-load.dto';
import {
  AssignedGateLoad,
  AssignedGateLoadStatus,
} from '../core/domain/entities/assigned-gate-load.entity';

@ApiTags('Assigned Gate Load')
@Controller('assigned-gate-load')
@ApiBearerAuth('JWT-auth')
export class AssignedGateLoadController {
  constructor(private readonly service: AssignedGateLoadService) { }

  @Post()
  @ApiOperation({ summary: 'Create assigned gate load' })
  @ApiResponse({
    status: 201,
    description: 'Assigned gate load created successfully',
    type: AssignedGateLoad,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createDto: CreateAssignedGateLoadDto) {
    return this.service.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assigned gate loads' })
  @ApiQuery({
    name: 'assigned_gate_id',
    required: false,
    description: 'Filter by assigned gate ID',
  })
  @ApiQuery({
    name: 'outbound_memo_id',
    required: false,
    description: 'Filter by outbound memo ID',
  })
  @ApiQuery({
    name: 'pallet_id',
    required: false,
    description: 'Filter by pallet ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned gate loads retrieved successfully',
    type: [AssignedGateLoad],
  })
  findAll(
    @Query('assigned_gate_id') assignedGateId?: string,
    @Query('outbound_memo_id') outboundMemoId?: string,
    @Query('pallet_id') palletId?: string,
  ) {
    if (assignedGateId) {
      return this.service.findAllByAssignedGate(assignedGateId);
    }
    if (outboundMemoId) {
      return this.service.findAllByOutboundMemo(outboundMemoId);
    }
    if (palletId) {
      return this.service.findAllByPalletId(palletId);
    }
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assigned gate load by id' })
  @ApiResponse({
    status: 200,
    description: 'Assigned gate load retrieved successfully',
    type: AssignedGateLoad,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate load not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assigned gate load' })
  @ApiResponse({
    status: 200,
    description: 'Assigned gate load updated successfully',
    type: AssignedGateLoad,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate load not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAssignedGateLoadDto) {
    return this.service.update(id, updateDto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Update status for assigned gate load' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(AssignedGateLoadStatus),
          example: AssignedGateLoadStatus.APPROVED,
          description: 'Status of the assigned gate load',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: AssignedGateLoad,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate load not found' })
  approve(
    @Param('id') id: string,
    @Body() body: { status: AssignedGateLoadStatus.APPROVED },
  ) {
    return this.service.approve(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assigned gate load' })
  @ApiResponse({ status: 200, description: 'Assigned gate load deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assigned gate load not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

