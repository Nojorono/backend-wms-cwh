import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApprovalService } from './approval.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ApproveRequestDto, RejectRequestDto } from './dto/approve-request.dto';
import { Approval } from '../core/domain/entities/approval.entity';
import { ApprovalPaginationDto } from './dto/approval-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';

@ApiTags('Approval')
@Controller('approval')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PaginatedResponseDto)
export class ApprovalController {
  constructor(private readonly service: ApprovalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new approval request' })
  @ApiResponse({ status: 201, type: Approval })
  @ApiResponse({ status: 400, description: 'Invalid request or pending request already exists' })
  @ApiResponse({ status: 404, description: 'Approval setup not found' })
  create(@Body() dto: CreateApprovalDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get approval requests with optional pagination and filtering' })
  @ApiFlexiblePaginationQuery([
    { name: 'status', description: 'Filter by approval status', example: 'PENDING' },
    { name: 'entity_type', description: 'Filter by entity type', example: 'STOCK_ADJUSTMENT' },
    { name: 'entity_id', description: 'Filter by entity ID', example: 'uuid-entity-123' },
  ])
  @ApiResponse({
    status: 200,
    description: 'List of approval requests or paginated response',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/Approval' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findAll(@Query() query: ApprovalPaginationDto) {
    const hasPaginationParams =
      query.search ||
      query.page ||
      query.limit ||
      query.sortBy ||
      query.sortOrder ||
      query.status ||
      query.entity_type ||
      query.entity_id;

    if (hasPaginationParams) {
      return this.service.findAllPaginated(query);
    }

    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval request by ID' })
  @ApiResponse({ status: 200, type: Approval })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve an approval request at current level' })
  @ApiBody({ type: ApproveRequestDto })
  @ApiResponse({ status: 200, type: Approval })
  @ApiResponse({ status: 400, description: 'Request is not pending or partially approved' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  approve(@Param('id') id: string, @Body() dto: ApproveRequestDto) {
    return this.service.approve(id, dto);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an approval request' })
  @ApiBody({ type: RejectRequestDto })
  @ApiResponse({ status: 200, type: Approval })
  @ApiResponse({ status: 400, description: 'Request is not pending or partially approved' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  reject(@Param('id') id: string, @Body() dto: RejectRequestDto) {
    return this.service.reject(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending approval request' })
  @ApiResponse({ status: 200, type: Approval })
  @ApiResponse({ status: 400, description: 'Request is not pending or partially approved' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  cancel(@Param('id') id: string, @Query('cancelled_by') cancelledBy?: string, @Query('reason') reason?: string) {
    return this.service.cancel(id, cancelledBy, reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an approval request (only if not approved)' })
  @ApiResponse({ status: 200, description: 'Approval request deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete approved request' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

