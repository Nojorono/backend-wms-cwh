import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StockAdjustmentApprovalService } from './stock-adjustment-approval.service';
import { CreateStockAdjustmentApprovalDto } from './dto/create-stock-adjustment-approval.dto';
import { UpdateStockAdjustmentApprovalDto } from './dto/update-stock-adjustment-approval.dto';
import { ApproveStockAdjustmentDto, RejectStockAdjustmentDto } from './dto/approve-stock-adjustment.dto';
import { StockAdjustmentApproval } from '../core/domain/entities/stock-adjustment-approval.entity';
import { StockAdjustmentApprovalPaginationDto } from './dto/stock-adjustment-approval-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';

@ApiTags('Stock Adjustment Approval')
@Controller('stock-adjustment-approval')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PaginatedResponseDto)
export class StockAdjustmentApprovalController {
  constructor(private readonly service: StockAdjustmentApprovalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stock adjustment approval request' })
  @ApiResponse({ status: 201, type: StockAdjustmentApproval })
  @ApiResponse({ status: 400, description: 'Invalid request or pending request already exists' })
  @ApiResponse({ status: 404, description: 'Pallet or item not found' })
  create(@Body() dto: CreateStockAdjustmentApprovalDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get stock adjustment approval requests with optional pagination and filtering' })
  @ApiFlexiblePaginationQuery([
    { name: 'status', description: 'Filter by approval status', example: 'PENDING' },
    { name: 'pallet_id', description: 'Filter by pallet ID', example: 'uuid-pallet-123' },
    { name: 'item_id', description: 'Filter by item ID', example: 'uuid-item-123' },
  ])
  @ApiResponse({
    status: 200,
    description: 'List of approval requests or paginated response',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/StockAdjustmentApproval' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findAll(@Query() query: StockAdjustmentApprovalPaginationDto) {
    const hasPaginationParams =
      query.search ||
      query.page ||
      query.limit ||
      query.sortBy ||
      query.sortOrder ||
      query.status ||
      query.pallet_id ||
      query.item_id;

    if (hasPaginationParams) {
      return this.service.findAllPaginated(query);
    }

    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock adjustment approval request by ID' })
  @ApiResponse({ status: 200, type: StockAdjustmentApproval })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pending stock adjustment approval request' })
  @ApiBody({ type: UpdateStockAdjustmentApprovalDto })
  @ApiResponse({ status: 200, type: StockAdjustmentApproval })
  @ApiResponse({ status: 400, description: 'Request is not pending or invalid data' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  update(@Param('id') id: string, @Body() dto: UpdateStockAdjustmentApprovalDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a stock adjustment request and perform the adjustment' })
  @ApiBody({ type: ApproveStockAdjustmentDto })
  @ApiResponse({ status: 200, type: StockAdjustmentApproval })
  @ApiResponse({ status: 400, description: 'Request is not pending' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  approve(@Param('id') id: string, @Body() dto: ApproveStockAdjustmentDto) {
    return this.service.approve(id, dto);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a stock adjustment request' })
  @ApiBody({ type: RejectStockAdjustmentDto })
  @ApiResponse({ status: 200, type: StockAdjustmentApproval })
  @ApiResponse({ status: 400, description: 'Request is not pending' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  reject(@Param('id') id: string, @Body() dto: RejectStockAdjustmentDto) {
    return this.service.reject(id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending stock adjustment request' })
  @ApiResponse({ status: 200, type: StockAdjustmentApproval })
  @ApiResponse({ status: 400, description: 'Request is not pending' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a stock adjustment approval request (only if not approved)' })
  @ApiResponse({ status: 200, description: 'Approval request deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete approved request' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

