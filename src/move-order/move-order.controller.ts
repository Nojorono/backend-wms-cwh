import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MoveOrderService } from './move-order.service';
import { CreateMoveOrderDto } from './dto/create-move-order.dto';
import { UpdateMoveOrderDto, UpdateMoveOrderStatusDto } from './dto/update-move-order.dto';
import { MoveOrder } from '../core/domain/entities/move-order.entity';
import { MoveOrderPaginationQueryDto } from './dto/move-order-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';

@ApiTags('Move Orders')
@Controller('move-orders')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PaginatedResponseDto)
export class MoveOrderController {
  constructor(private readonly moveOrderService: MoveOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new move order with its items' })
  @ApiResponse({ status: 201, type: MoveOrder })
  create(@Body() payload: CreateMoveOrderDto) {
    return this.moveOrderService.create(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Get move orders with optional pagination and filtering' })
  @ApiFlexiblePaginationQuery([
    { name: 'status', description: 'Filter by move order status', example: 'CREATED' },
    { name: 'type', description: 'Filter by move order type', example: 'TRANSFER_SELISIH' },
  ])
  @ApiResponse({
    status: 200,
    description: 'List of move orders or paginated response',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/MoveOrder' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findAll(@Query() query: MoveOrderPaginationQueryDto) {
    const hasPaginationParams =
      query.search ||
      query.page ||
      query.limit ||
      query.sortBy ||
      query.sortOrder ||
      query.status ||
      query.type;

    if (hasPaginationParams) {
      return this.moveOrderService.findAllPaginated(query);
    }

    return this.moveOrderService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get move order detail' })
  @ApiResponse({ status: 200, type: MoveOrder })
  findOne(@Param('id') id: string) {
    return this.moveOrderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a move order and optionally replace its items' })
  @ApiBody({ type: UpdateMoveOrderDto })
  @ApiResponse({ status: 200, type: MoveOrder })
  update(@Param('id') id: string, @Body() payload: UpdateMoveOrderDto) {
    return this.moveOrderService.update(id, payload);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update move order status only' })
  @ApiBody({ type: UpdateMoveOrderStatusDto })
  @ApiResponse({ status: 200, type: MoveOrder })
  updateStatus(@Param('id') id: string, @Body() payload: UpdateMoveOrderStatusDto) {
    return this.moveOrderService.updateStatus(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a move order along with its items' })
  @ApiResponse({ status: 200, description: 'Move order deleted successfully' })
  remove(@Param('id') id: string) {
    return this.moveOrderService.remove(id);
  }
}

