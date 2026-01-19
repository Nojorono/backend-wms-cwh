import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApprovalSetupService } from './approval-setup.service';
import { CreateApprovalSetupDto } from './dto/create-approval-setup.dto';
import { UpdateApprovalSetupDto } from './dto/update-approval-setup.dto';
import { ApprovalSetup } from '../core/domain/entities/approval-setup.entity';
import { ApprovalSetupPaginationDto } from './dto/approval-setup-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';

@ApiTags('Approval Setup')
@Controller('approval-setup')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PaginatedResponseDto)
export class ApprovalSetupController {
  constructor(private readonly service: ApprovalSetupService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new approval setup with hierarchy' })
  @ApiResponse({ status: 201, type: ApprovalSetup })
  @ApiResponse({ status: 400, description: 'Invalid request or validation error' })
  create(@Body() dto: CreateApprovalSetupDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get approval setups with optional pagination and filtering' })
  @ApiFlexiblePaginationQuery([
    { name: 'entity_type', description: 'Filter by entity type', example: 'STOCK_ADJUSTMENT' },
    { name: 'is_active', description: 'Filter by active status', example: true },
  ])
  @ApiResponse({
    status: 200,
    description: 'List of approval setups or paginated response',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/ApprovalSetup' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findAll(@Query() query: ApprovalSetupPaginationDto) {
    const hasPaginationParams =
      query.search ||
      query.page ||
      query.limit ||
      query.sortBy ||
      query.sortOrder ||
      query.entity_type ||
      query.is_active !== undefined;

    if (hasPaginationParams) {
      return this.service.findAllPaginated(query);
    }

    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approval setup by ID' })
  @ApiResponse({ status: 200, type: ApprovalSetup })
  @ApiResponse({ status: 404, description: 'Approval setup not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an approval setup and its levels' })
  @ApiBody({ type: UpdateApprovalSetupDto })
  @ApiResponse({ status: 200, type: ApprovalSetup })
  @ApiResponse({ status: 404, description: 'Approval setup not found' })
  update(@Param('id') id: string, @Body() dto: UpdateApprovalSetupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an approval setup' })
  @ApiResponse({ status: 200, description: 'Approval setup deleted successfully' })
  @ApiResponse({ status: 404, description: 'Approval setup not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

