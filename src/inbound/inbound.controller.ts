import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiExtraModels, ApiBody, ApiQuery } from '@nestjs/swagger';
import { InboundService } from './inbound.service';
import { CreateInboundDto, CreateInboundDoDto, CreateInboundItemDto } from './dto/create-inbound.dto';
import { UpdateInboundDto, UpdateInboundStatusDto  } from './dto/update-inbound.dto';
import { Inbound } from '../core/domain/entities/inbound.entity';
import { AssignedHelper } from '../core/domain/entities/assigned-helper.entity';
import { InboundPaginationQueryDto } from './dto/inbound-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { DoValidationIntegrationService } from './integration/do-validation.integration';
import { UpdateSaldoInspectionDto } from './dto/update-saldo-inspection.dto';
import { BulkUpdateSaldoInspectionDto } from './dto/bulk-update-saldo-inspection.dto';
import { InboundItem } from '../core/domain/entities/inbound-item.entity';

@ApiTags('Inbound')
@Controller('inbound')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(CreateInboundDoDto, CreateInboundItemDto, AssignedHelper)
export class InboundController {
  constructor(private readonly service: InboundService, private readonly doValidationIntegrationService: DoValidationIntegrationService) {}

  @Post()
  @ApiOperation({ summary: 'Create inbound with optional DOs and Items' })
  @ApiResponse({ status: 201, type: Inbound })
  @ApiBody({ type: CreateInboundDto })
  create(@Body() dto: CreateInboundDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all inbounds with pagination' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'status',
      description: 'Filter inbounds by status',
      example: 'CREATED',
    },
  ])
  @ApiResponse({ status: 200, type: PaginatedResponseDto<Inbound> })
  findAll(@Query() paginationQuery: InboundPaginationQueryDto) {
    return this.service.findAllPaginated(paginationQuery);
  }

  @Get('inspection')
  @ApiOperation({ summary: 'Find all transaction scan inbound where status is PENDING' })
  @ApiQuery({ name: 'status', type: String, required: false, example: 'PENDING' })
  @ApiResponse({ status: 200, type: [Inbound]})
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

  // find by surat jalan
  @Get('do-validation/:suratJalan')
  @ApiOperation({ summary: 'Find inbound by do validation surat jalan' })
  @ApiResponse({ status: 200, type: Inbound })
  findByDoValidationSuratJalan(@Param('suratJalan') suratJalan: string) {
    return this.doValidationIntegrationService.getDoValidationBySuratJalan(suratJalan);
  }

  // bulk update saldo inspection
  @Patch('inbound-items/bulk/saldo-inspection')
  @ApiOperation({ summary: 'Bulk update inbound items saldo inspection' })
  @ApiResponse({ status: 200, type: [InboundItem] })
  @ApiBody({ type: BulkUpdateSaldoInspectionDto })
  bulkUpdateInboundItemSaldoInspection(@Body() dto: BulkUpdateSaldoInspectionDto) {
    return this.service.bulkUpdateInboundItemSaldoInspection(dto);
  }

  // sequential status
  @Patch('sequential-status/:id')
  @ApiOperation({ summary: 'Sequential status inbound' })
  @ApiResponse({ status: 200, type: Inbound })
  sequentialStatus(@Param('id') id: string) {
    return this.service.sequentialStatus(id);
  }

}

