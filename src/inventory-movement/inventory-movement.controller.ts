import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';
import { InventoryMovementService } from './inventory-movement.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';
import { InventoryMovement } from '../core/domain/entities/inventory-movement.entity';
import { InventoryMovementPaginationQueryDto } from './dto/inventory-movement-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@ApiTags('Inventory Movement')
@Controller('inventory-movement')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PaginatedResponseDto)
export class InventoryMovementController {
  constructor(private readonly service: InventoryMovementService) {}

  @Post()
  @ApiOperation({ summary: 'Create inventory movement request' })
  @ApiResponse({
    status: 201,
    description: 'Inventory movement created successfully',
    type: InventoryMovement,
  })
  async create(@Body() dto: CreateInventoryMovementDto) {
    const result = await this.service.create(dto);
    return {
      success: true,
      message: 'Inventory movement berhasil dibuat',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all inventory movements or search with pagination' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'status',
      description: 'Filter by movement status',
      example: 'PENDING',
    },
    {
      name: 'assigned_user_id',
      description: 'Filter by assigned user ID',
      example: 'uuid-user-123',
    },
    {
      name: 'source_warehouse_id',
      description: 'Filter by source warehouse ID',
      example: 'uuid-warehouse-123',
    },
    {
      name: 'source_warehouse_sub_id',
      description: 'Filter by source warehouse sub ID',
      example: 'uuid-warehouse-sub-123',
    },
    {
      name: 'destination_warehouse_id',
      description: 'Filter by destination warehouse ID',
      example: 'uuid-warehouse-123',
    },
    {
      name: 'destination_warehouse_sub_id',
      description: 'Filter by destination warehouse sub ID',
      example: 'uuid-warehouse-sub-123',
    },
    {
      name: 'pallet_id',
      description: 'Filter by pallet ID',
      example: 'uuid-pallet-123',
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Return all inventory movements or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/InventoryMovement' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  async findAll(@Query() paginationQuery: InventoryMovementPaginationQueryDto) {
    // Check if any pagination parameters are provided
    const hasPaginationParams =
      paginationQuery.search ||
      paginationQuery.page ||
      paginationQuery.limit ||
      paginationQuery.sortBy ||
      paginationQuery.sortOrder ||
      paginationQuery.status ||
      paginationQuery.assigned_user_id ||
      paginationQuery.source_warehouse_id ||
      paginationQuery.source_warehouse_sub_id ||
      paginationQuery.destination_warehouse_id ||
      paginationQuery.destination_warehouse_sub_id ||
      paginationQuery.pallet_id;

    if (hasPaginationParams) {
      return this.service.findAllPaginated(paginationQuery);
    }

    const result = await this.service.findAll();
    return {
      success: true,
      message: 'Data inventory movement berhasil diambil',
      data: result,
    };
  }

  @Get('assigned/:userId')
  @ApiOperation({ summary: 'Get inventory movements assigned to a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'List of movements assigned to user',
    type: [InventoryMovement],
  })
  async findByAssignedUserId(@Param('userId') userId: string) {
    const result = await this.service.findByAssignedUserId(userId);
    return {
      success: true,
      message: 'Data inventory movement berdasarkan assigned user berhasil diambil',
      data: result,
    };
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get inventory movements by status' })
  @ApiParam({ name: 'status', description: 'Movement status' })
  @ApiResponse({
    status: 200,
    description: 'List of movements by status',
    type: [InventoryMovement],
  })
  async findByStatus(@Param('status') status: string) {
    const result = await this.service.findByStatus(status as any);
    return {
      success: true,
      message: 'Data inventory movement berdasarkan status berhasil diambil',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory movement detail' })
  @ApiParam({ name: 'id', description: 'Inventory movement ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory movement detail',
    type: InventoryMovement,
  })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return {
      success: true,
      message: 'Detail inventory movement berhasil diambil',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory movement' })
  @ApiParam({ name: 'id', description: 'Inventory movement ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory movement updated successfully',
    type: InventoryMovement,
  })
  async update(@Param('id') id: string, @Body() dto: UpdateInventoryMovementDto) {
    const result = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Inventory movement berhasil diupdate',
      data: result,
    };
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign job to user for inventory movement' })
  @ApiParam({ name: 'id', description: 'Inventory movement ID' })
  @ApiResponse({
    status: 200,
    description: 'Job assigned successfully',
    type: InventoryMovement,
  })
  async assignJob(
    @Param('id') id: string,
    @Body() body: { user_id: string; user_name: string },
  ) {
    const result = await this.service.assignJob(id, body.user_id, body.user_name);
    return {
      success: true,
      message: 'Job berhasil ditugaskan',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete inventory movement' })
  @ApiParam({ name: 'id', description: 'Inventory movement ID' })
  @ApiResponse({
    status: 204,
    description: 'Inventory movement deleted successfully',
  })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      success: true,
      message: 'Inventory movement berhasil dihapus',
    };
  }
}

