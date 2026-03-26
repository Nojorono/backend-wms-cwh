import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InboundService } from '../inbound/inbound.service';
import { InboundPaginationQueryDto } from '../inbound/dto/inbound-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { AssignedHelper } from '../core/domain/entities/assigned-helper.entity';
import { CreateInboundDoDto, CreateInboundItemDto } from '../inbound/dto/create-inbound.dto';

@ApiTags('Report')
@Controller('report')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(CreateInboundDoDto, CreateInboundItemDto, AssignedHelper)
export class ReportController {
  constructor(private readonly inboundService: InboundService) {}

  @Get('inbound')
  @ApiOperation({
    summary: 'Report: list all inbounds or search with pagination (same as GET /inbound)',
  })
  @ApiFlexiblePaginationQuery([
    {
      name: 'status',
      description: 'Filter inbounds by status',
      example: 'CREATED',
    },
    {
      name: 'start_date',
      description: 'Filter by created date (start, inclusive, ISO date)',
      example: '2026-03-01',
    },
    {
      name: 'end_date',
      description: 'Filter by created date (end, inclusive, ISO date)',
      example: '2026-03-31',
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Return all inbounds or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/Inbound' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findInboundReport(@Query() paginationQuery: InboundPaginationQueryDto) {
    const hasPaginationParams =
      paginationQuery.search ||
      paginationQuery.page ||
      paginationQuery.limit ||
      paginationQuery.sortBy ||
      paginationQuery.sortOrder ||
      paginationQuery.status;

    if (hasPaginationParams) {
      return this.inboundService.findAllPaginated(paginationQuery);
    }

    return this.inboundService.findAll();
  }
}
