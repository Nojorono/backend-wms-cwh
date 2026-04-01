import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InboundReportQueryDto } from './dto/inbound-report-query.dto';
import { OutboundReportQueryDto } from './dto/outbound-report-query.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { AssignedHelper } from '../core/domain/entities/assigned-helper.entity';
import { CreateInboundDoDto, CreateInboundItemDto } from '../inbound/dto/create-inbound.dto';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { ReportService } from './report.service';

@ApiTags('Report')
@Controller('report')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(CreateInboundDoDto, CreateInboundItemDto, AssignedHelper, OutboundDo)
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

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
  findInboundReport(@Query() query: InboundReportQueryDto) {
    return this.reportService.findInboundReport(query);
  }

  @Get('outbound')
  @ApiOperation({
    summary:
      'Report: list all outbound DOs or search with pagination (same as GET /outbound-do)',
  })
  @ApiFlexiblePaginationQuery([
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
    description: 'Return all outbound DOs or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/OutboundDo' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findOutboundReport(@Query() query: OutboundReportQueryDto) {
    return this.reportService.findOutboundReport(query);
  }
}
