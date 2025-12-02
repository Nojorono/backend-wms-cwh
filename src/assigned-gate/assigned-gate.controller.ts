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
    name: 'outbound_do_id',
    required: false,
    type: String,
    description: 'Filter by outbound DO ID',
    example: 'uuid-outbound-do-123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned gates retrieved successfully',
    type: [AssignedGate],
  })
  findAll(@Query('outbound_do_id') outboundDoId?: string) {
    if (outboundDoId) {
      return this.assignedGateService.findAllByOutboundDo(outboundDoId);
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

  // AssignedGateUser endpoints
  @Post('user')
  @ApiOperation({ summary: 'Create or update assigned gate user (provide id to update, omit to create)' })
  @ApiResponse({
    status: 201,
    description: 'Assigned gate user created or updated successfully',
    type: AssignedGateUser,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Assigned gate user not found (when updating)' })
  createOrUpdateUser(@Body() createAssignedGateUserDto: CreateAssignedGateUserDto) {
    return this.assignedGateService.createOrUpdateUser(createAssignedGateUserDto);
  }

  @Get('user')
  @ApiOperation({ summary: 'List all assigned gate users' })
  @ApiQuery({
    name: 'assigned_gate_id',
    required: false,
    type: String,
    description: 'Filter by assigned gate ID',
    example: 'uuid-assigned-gate-123',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    type: String,
    description: 'Filter by user ID',
    example: 'uuid-user-123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned gate users retrieved successfully',
    type: [AssignedGateUser],
  })
  findAllUsers(
    @Query('assigned_gate_id') assignedGateId?: string,
    @Query('user_id') userId?: string,
  ) {
    if (assignedGateId) {
      return this.assignedGateService.findAllUsersByAssignedGate(assignedGateId);
    }
    if (userId) {
      return this.assignedGateService.findAllUsersByUserId(userId);
    }
    return this.assignedGateService.findAllUsers();
  }

  @Get('user/:user_id')
  @ApiOperation({ summary: 'Get all assigned gate users by user_id' })
  @ApiResponse({
    status: 200,
    description: 'List of assigned gate users retrieved successfully',
    type: [AssignedGateUser],
  })
  @ApiResponse({ status: 404, description: 'Assigned gate user not found' })
  findAllByUserId(@Param('user_id') userId: string) {
    return this.assignedGateService.findAllUsersByUserId(userId);
  }


  @Delete('user/:id')
  @ApiOperation({ summary: 'Delete assigned gate user' })
  @ApiResponse({ status: 200, description: 'Assigned gate user deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assigned gate user not found' })
  removeUser(@Param('id') id: string) {
    return this.assignedGateService.removeUser(id);
  }
}

