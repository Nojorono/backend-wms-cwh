import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExtraModels,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { InboundService } from './inbound.service';
import {
  CreateInboundDto,
  CreateInboundDoDto,
  CreateInboundItemDto,
} from './dto/create-inbound.dto';
import { UpdateInboundDto, UpdateInboundStatusDto } from './dto/update-inbound.dto';
import { Inbound } from '../core/domain/entities/inbound.entity';
import { AssignedHelper } from '../core/domain/entities/assigned-helper.entity';
import { InboundPaginationQueryDto } from './dto/inbound-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { DoValidationIntegrationService } from './integration/do-validation.integration';
import { BulkUpdateSaldoInspectionDto } from './dto/bulk-update-saldo-inspection.dto';
import { InboundItem } from '../core/domain/entities/inbound-item.entity';
import { OrganizationId } from 'src/core/decorators/organization-id.decorator';

@ApiTags('Inbound')
@Controller('inbound')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(CreateInboundDoDto, CreateInboundItemDto, AssignedHelper)
export class InboundController {
  constructor(
    private readonly service: InboundService,
    private readonly doValidationIntegrationService: DoValidationIntegrationService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create inbound with optional DOs and Items' })
  @ApiResponse({ status: 201, type: Inbound })
  @ApiBody({ type: CreateInboundDto })
  create(@Body() dto: CreateInboundDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all inbounds or search with pagination' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'status',
      description: 'Filter inbounds by status',
      example: 'CREATED',
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Return all inbounds or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/Inbound' }
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' }
      ]
    }
  })
  findAll(@Query() paginationQuery: InboundPaginationQueryDto, @OrganizationId() organizationId: string | number | null) {
    // Check if any pagination parameters are provided
    const hasPaginationParams = paginationQuery.search || paginationQuery.page || paginationQuery.limit ||
      paginationQuery.sortBy || paginationQuery.sortOrder || paginationQuery.status;

    if (hasPaginationParams) {
      return this.service.findAllPaginated(paginationQuery, organizationId);
    }

    return this.service.findAll(organizationId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all inbounds (alternative endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Return all inbounds.',
    type: [Inbound],
  })
  findAllInbounds(@OrganizationId() organizationId: string | number | null) {
    return this.service.findAll(organizationId);
  }

  @Get('inspection')
  @ApiOperation({ summary: 'Find all transaction scan inbound where status is PENDING' })
  @ApiQuery({ name: 'status', type: String, required: false, example: 'PENDING' })
  @ApiResponse({ status: 200, type: [Inbound] })
  findAllInspection(@Query('status') status: string) {
    return this.service.findAllTransactionScanInbound(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inbound by id' })
  @ApiResponse({ status: 200, type: Inbound })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inbound fields' })
  @ApiResponse({ status: 200, type: Inbound })
  @ApiBody({ type: UpdateInboundDto })
  update(@Param('id') id: string, @Body() dto: UpdateInboundDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inbound' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // update status
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update inbound status' })
  @ApiResponse({ status: 200, type: Inbound })
  @ApiBody({ type: UpdateInboundStatusDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInboundStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  // find by assigned helper id
  @Get('assigned-helper/:id')
  @ApiOperation({ summary: 'Find inbound by assigned helper user id' })
  @ApiResponse({ status: 200, type: Inbound })
  findByAssignedHelperId(@Param('id') id: string) {
    return this.service.findByAssignedHelperId(id);
  }

  // find by surat jalan (query param friendly, supports "/" safely)
  @Get('do-validation/:type')
  @ApiOperation({ summary: 'Find inbound by do validation surat jalan (via query param)' })
  @ApiParam({
    name: 'type',
    required: true,
    type: String,
    description: 'Validation type',
    example: 'SO',
    enum: ['SO', 'PO'],
  })
  @ApiQuery({
    name: 'suratJalan',
    required: true,
    type: String,
    description: 'Delivery order number / surat jalan',
    example: 'DO-SHP-SMD2026/03/00100',
  })
  @ApiResponse({ status: 200, type: Inbound })
  findByDoValidationSuratJalan(
    @Param('type') type: 'SO' | 'PO',
    @Query('suratJalan') suratJalan: string,
  ) {
    return this.doValidationIntegrationService.getDoValidation(suratJalan, type);
  }

  // legacy path param route kept for backward compatibility
  @Get('do-validation/:type/:suratJalan')
  @ApiOperation({ summary: 'Find inbound by do validation surat jalan (legacy path param)' })
  @ApiParam({
    name: 'type',
    required: true,
    type: String,
    description: 'Validation type',
    example: 'SO',
    enum: ['SO', 'PO'],
  })
  @ApiResponse({ status: 200, type: Inbound })
  findByDoValidationSuratJalanLegacy(
    @Param('type') type: 'SO' | 'PO',
    @Param('suratJalan') suratJalan: string,
  ) {
    return this.doValidationIntegrationService.getDoValidation(suratJalan, type);
  }

  // bulk update saldo inspection
  @Patch('inbound-items/bulk/saldo-inspection')
  @ApiOperation({ summary: 'Bulk update inbound items saldo inspection' })
  @ApiResponse({ status: 200, type: [InboundItem] })
  @ApiBody({ type: BulkUpdateSaldoInspectionDto })
  bulkUpdateInboundItemSaldoInspection(@Body() dto: BulkUpdateSaldoInspectionDto) {
    return this.service.bulkUpdateInboundItemSaldoInspection(dto);
  }

  // integration to oracle by inbound id
  @Post('integration-to-oracle/:id')
  @ApiOperation({ summary: 'Integration to oracle by inbound id' })
  @ApiResponse({ status: 200, type: Inbound })
  integrationToOracle(@Param('id') id: string) {
    return this.service.integrationToOracle(id);
  }
}
