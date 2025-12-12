import { Controller, Get, Post, Body, Param, Delete, Query, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AssignedGateService } from './assigned-gate.service';
import { CreateAssignedGateDto } from './dto/create-assigned-gate.dto';
import { CreateAssignedGateUserDto } from './dto/create-assigned-gate-user.dto';
import { UpdateAssignedGateUserDto } from './dto/update-assigned-gate-user.dto';
import { CreateAssignedGatePalletDto } from './dto/create-assigned-gate-pallet.dto';
import { UpdateAssignedGatePalletDto } from './dto/update-assigned-gate-pallet.dto';
import { UpdateAssignedGateStatusDto } from './dto/update-assigned-gate-status.dto';
import { AssignedGate, AssignedGateStatus } from '../core/domain/entities/assigned-gate.entity';
import { AssignedGateUser } from '../core/domain/entities/assigned-gate-user.entity';
import { AssignedGatePallet } from '../core/domain/entities/assigned-gate-pallet.entity';

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
  @ApiOperation({ summary: 'List all assigned gates with optional filters' })
  @ApiQuery({
    name: 'user_id',
    required: false,
    type: String,
    description: 'Filter by user ID',
    example: 'uuid-user-123',
  })
  @ApiQuery({
    name: 'gate_id',
    required: false,
    type: String,
    description: 'Filter by gate ID (MasterWarehouseSub ID)',
    example: 'uuid-gate-123',
  })
  @ApiQuery({
    name: 'outbound_do_id',
    required: false,
    type: String,
    description: 'Filter by outbound DO ID',
    example: 'uuid-outbound-do-123',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AssignedGateStatus,
    description: 'Filter by status',
    example: AssignedGateStatus.PENDING,
  })
  @ApiResponse({
    status: 200,
    description: 'List of assigned gates retrieved successfully',
    type: [AssignedGate],
  })
  findAll(
    @Query('user_id') userId?: string,
    @Query('gate_id') gateId?: string,
    @Query('outbound_do_id') outboundDoId?: string,
    @Query('status') status?: string,
  ) {
    const filters: {
      user_id?: string;
      gate_id?: string;
      outbound_do_id?: string;
      status?: string;
    } = {};

    if (userId) filters.user_id = userId;
    if (gateId) filters.gate_id = gateId;
    if (outboundDoId) filters.outbound_do_id = outboundDoId;
    if (status) filters.status = status;

    return this.assignedGateService.findAll(Object.keys(filters).length > 0 ? filters : undefined);
  }

  // User management endpoints by assigned-gate-id (must come before :id route)
  @Post(':assignedGateId/users')
  @ApiOperation({ summary: 'Add user to assigned gate' })
  @ApiResponse({
    status: 201,
    description: 'User added to assigned gate successfully',
    type: AssignedGateUser,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate not found' })
  addUserToGate(
    @Param('assignedGateId') assignedGateId: string,
    @Body() createUserDto: CreateAssignedGateUserDto,
  ) {
    return this.assignedGateService.addUserToGate(assignedGateId, createUserDto);
  }

  @Get(':assignedGateId/users')
  @ApiOperation({ summary: 'Get all users by assigned gate ID' })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    type: [AssignedGateUser],
  })
  @ApiResponse({ status: 404, description: 'Assigned gate not found' })
  getUsersByGate(@Param('assignedGateId') assignedGateId: string) {
    return this.assignedGateService.getUsersByGate(assignedGateId);
  }

  @Patch(':assignedGateId/users/:userId')
  @ApiOperation({ summary: 'Update user in assigned gate' })
  @ApiBody({
    type: UpdateAssignedGateUserDto,
    description: 'Update user data in assigned gate',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: AssignedGateUser,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate or user not found' })
  @ApiResponse({ status: 400, description: 'User does not belong to this assigned gate' })
  updateUserInGate(
    @Param('assignedGateId') assignedGateId: string,
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateAssignedGateUserDto,
  ) {
    return this.assignedGateService.updateUserInGate(assignedGateId, userId, updateUserDto);
  }

  @Delete(':assignedGateId/users/:userId')
  @ApiOperation({ summary: 'Remove user from assigned gate' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  @ApiResponse({ status: 404, description: 'Assigned gate or user not found' })
  @ApiResponse({ status: 400, description: 'User does not belong to this assigned gate' })
  removeUserFromGate(
    @Param('assignedGateId') assignedGateId: string,
    @Param('userId') userId: string,
  ) {
    return this.assignedGateService.removeUserFromGate(assignedGateId, userId);
  }

  // Pallet management endpoints by assigned-gate-id
  @Post(':assignedGateId/pallets')
  @ApiOperation({ summary: 'Add pallet to assigned gate' })
  @ApiResponse({
    status: 201,
    description: 'Pallet added to assigned gate successfully',
    type: AssignedGatePallet,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate not found' })
  addPalletToGate(
    @Param('assignedGateId') assignedGateId: string,
    @Body() createPalletDto: CreateAssignedGatePalletDto,
  ) {
    return this.assignedGateService.addPalletToGate(assignedGateId, createPalletDto);
  }

  @Get(':assignedGateId/pallets')
  @ApiOperation({ summary: 'Get all pallets by assigned gate ID' })
  @ApiResponse({
    status: 200,
    description: 'List of pallets retrieved successfully',
    type: [AssignedGatePallet],
  })
  @ApiResponse({ status: 404, description: 'Assigned gate not found' })
  getPalletsByGate(@Param('assignedGateId') assignedGateId: string) {
    return this.assignedGateService.getPalletsByGate(assignedGateId);
  }

  @Patch(':assignedGateId/pallets/:palletId')
  @ApiOperation({ summary: 'Update pallet in assigned gate' })
  @ApiBody({
    type: UpdateAssignedGatePalletDto,
    description: 'Update pallet data in assigned gate',
  })
  @ApiResponse({
    status: 200,
    description: 'Pallet updated successfully',
    type: AssignedGatePallet,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate or pallet not found' })
  @ApiResponse({ status: 400, description: 'Pallet does not belong to this assigned gate' })
  updatePalletInGate(
    @Param('assignedGateId') assignedGateId: string,
    @Param('palletId') palletId: string,
    @Body() updatePalletDto: UpdateAssignedGatePalletDto,
  ) {
    return this.assignedGateService.updatePalletInGate(assignedGateId, palletId, updatePalletDto);
  }

  @Delete(':assignedGateId/pallets/:palletId')
  @ApiOperation({ summary: 'Remove pallet from assigned gate' })
  @ApiResponse({ status: 200, description: 'Pallet removed successfully' })
  @ApiResponse({ status: 404, description: 'Assigned gate or pallet not found' })
  @ApiResponse({ status: 400, description: 'Pallet does not belong to this assigned gate' })
  removePalletFromGate(
    @Param('assignedGateId') assignedGateId: string,
    @Param('palletId') palletId: string,
  ) {
    return this.assignedGateService.removePalletFromGate(assignedGateId, palletId);
  }

  // Generic assigned gate endpoints (must come after specific routes)
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

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update assigned gate status' })
  @ApiBody({
    type: UpdateAssignedGateStatusDto,
    description: 'Update assigned gate status',
  })
  @ApiResponse({
    status: 200,
    description: 'Assigned gate status updated successfully',
    type: AssignedGate,
  })
  @ApiResponse({ status: 404, description: 'Assigned gate not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAssignedGateStatusDto,
  ) {
    return this.assignedGateService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete assigned gate' })
  @ApiResponse({ status: 200, description: 'Assigned gate deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assigned gate not found' })
  remove(@Param('id') id: string) {
    return this.assignedGateService.remove(id);
  }
}

