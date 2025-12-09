import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AssignedGateService } from './assigned-gate.service';
import { CreateAssignedGateDto } from './dto/create-assigned-gate.dto';
import { CreateAssignedGateUserDto } from './dto/create-assigned-gate-user.dto';
import { AssignedGate } from '../core/domain/entities/assigned-gate.entity';
import { AssignedGateUser } from '../core/domain/entities/assigned-gate-user.entity';

@ApiTags('Assigned Gate')
@Controller('assigned-gate')
@ApiBearerAuth('JWT-auth')
export class AssignedGateController {
  constructor(private readonly assignedGateService: AssignedGateService) {}

  // AssignedGate endpoints
  @Post()
  @ApiOperation({ summary: 'Create or update assigned gate (provide id to update, omit to create)' })
  @ApiResponse({
    status: 201,
    description: 'Assigned gate created or updated successfully',
    type: AssignedGate,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Assigned gate not found (when updating)' })
  createOrUpdate(@Body() createAssignedGateDto: CreateAssignedGateDto) {
    return this.assignedGateService.createOrUpdate(createAssignedGateDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all assigned gates' })
  @ApiQuery({
    name: 'user_id',
    required: false,
    type: String,
    description: 'Filter by user ID',
    example: 'uuid-user-123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned gates retrieved successfully',
    type: [AssignedGate],
  })
  findAll(@Query('user_id') userId?: string) {
    if (userId) {
      return this.assignedGateService.findAllByUserId(userId);
    }
    return this.assignedGateService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assigned gate by id' })
  @ApiResponse({
    status: 200,
    description: 'Assigned gate retrieved successfully',
    type: AssignedGate,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate not found' })
  findOne(@Param('id') id: string) {
    return this.assignedGateService.findOne(id);
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete assigned gate' })
  @ApiResponse({ status: 200, description: 'Assigned gate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assigned gate not found' })
  remove(@Param('id') id: string) {
    return this.assignedGateService.remove(id);
  }
}

