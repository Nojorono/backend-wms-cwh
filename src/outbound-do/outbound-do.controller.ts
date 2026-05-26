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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { OutboundDoService } from './outbound-do.service';
import { CreateOutboundDoDto } from './dto/create-outbound-do.dto';
import { UpdateOutboundDoDto } from './dto/update-outbound-do.dto';
import { OutboundDoResponseDto } from './dto/outbound-do-response.dto';
import { OutboundDoStatus, OutboundDoType } from '../core/domain/entities/outbound-do.entity';
import { Status as TransactionPickingStatus } from '../core/domain/entities/transaction-picking.entity';
import { OutboundDoPaginationDto } from './dto/outbound-do-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { OrganizationId } from '../core/decorators/organization-id.decorator';
import { CreateShipConfirmInternalDto } from './dto/create-ship-confirm-internal.dto';
import { CreateOutboundIntegrationDeliveriesDto } from 'src/outbound-integration-deliveries/dto/create-outbound-integration-deliveries.dto';

@ApiTags('Outbound DO')
@Controller('outbound-do')
@ApiBearerAuth('JWT-auth')
export class OutboundDoController {
  constructor(
    private readonly outboundDoService: OutboundDoService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat outbound DO baru' })
  @ApiResponse({
    status: 201,
    description: 'Outbound DO berhasil dibuat',
    type: OutboundDoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Sequence numbers must be unique' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Outbound DO number sudah digunakan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO number sudah digunakan' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  async create(@Body() createOutboundDoDto: CreateOutboundDoDto) {
    return this.outboundDoService.create(createOutboundDoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Dapatkan semua outbound DO' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'status',
      description: 'Filter outbound DO berdasarkan status',
      enum: Object.values(OutboundDoStatus),
      example: OutboundDoStatus.PENDING,
    },
    {
      name: 'outbound_type',
      description: 'Filter outbound DO berdasarkan tipe outbound',
      enum: Object.values(OutboundDoType),
      example: OutboundDoType.SUBDIST,
    },
    {
      name: 'has_transaction_scan_picking',
      description: 'Filter outbound DO yang memiliki transaction scan picking (true/false)',
      type: Boolean,
      example: true,
    },
    {
      name: 'transaction_picking_status',
      description: 'Filter outbound DO berdasarkan status transaction picking',
      enum: Object.values(TransactionPickingStatus),
      example: TransactionPickingStatus.PENDING,
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Daftar outbound DO',
    type: [OutboundDoResponseDto],
  })
  async findAll(
    @Query() paginationQuery: OutboundDoPaginationDto,
    @OrganizationId() organizationId: string,
  ) {
    const hasPaginationParams =
      paginationQuery.page ||
      paginationQuery.limit ||
      paginationQuery.search ||
      paginationQuery.sortBy ||
      paginationQuery.sortOrder ||
      paginationQuery.status ||
      paginationQuery.outbound_type ||
      paginationQuery.has_transaction_scan_picking !== undefined ||
      paginationQuery.transaction_picking_status;

    if (hasPaginationParams) {
      return this.outboundDoService.findAllPaginated(paginationQuery, organizationId);
    }

    return this.outboundDoService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dapatkan outbound DO berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiQuery({
    name: 'transaction_picking_status',
    required: false,
    enum: TransactionPickingStatus,
    description: 'Filter transaction pickings by status',
    example: TransactionPickingStatus.PENDING,
  })
  @ApiResponse({
    status: 200,
    description: 'Detail outbound DO',
    type: OutboundDoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async findOne(
    @Param('id') id: string,
    @Query('transaction_picking_status') transactionPickingStatus?: string,
  ) {
    return this.outboundDoService.findOne(id.trim(), transactionPickingStatus);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update outbound DO' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 200,
    description: 'Outbound DO berhasil diupdate',
    type: OutboundDoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Format nomor telepon tidak valid' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateOutboundDoDto: UpdateOutboundDoDto) {
    return this.outboundDoService.update(id, updateOutboundDoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus outbound DO' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 204,
    description: 'Outbound DO berhasil dihapus',
  })
  @ApiResponse({
    status: 400,
    description: 'Tidak dapat menghapus outbound DO',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Tidak dapat menghapus outbound DO yang sudah COMPLETED',
        },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.outboundDoService.remove(id);
  }

  @Get(':id/memo-sequence')
  @ApiOperation({ summary: 'Dapatkan urutan sequence memo dalam outbound DO (sorted by sequence)' })
  @ApiResponse({
    status: 200,
    description: 'Sequence memo berhasil didapatkan (automatically sorted by sequence number)',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          memoId: { type: 'string', example: 'uuid-memo-1' },
          sequence: { type: 'number', example: 1 },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async getMemoSequence(@Param('id') id: string) {
    return this.outboundDoService.getMemoSequence(id);
  }

  // find by assigned user id
  @Get('assigned-user/:userId')
  @ApiOperation({ summary: 'Dapatkan outbound DO berdasarkan ID user yang ditugaskan' })
  @ApiParam({ name: 'userId', description: 'ID user yang ditugaskan' })
  @ApiResponse({
    status: 200,
    description: 'Outbound DO berhasil ditemukan',
    type: [OutboundDoResponseDto],
  })
  async findByAssignedUserId(@Param('userId') userId: string) {
    return this.outboundDoService.findByAssignedUserId(userId);
  }

  // detach memo from outbound do
  @Patch(':id/detach-memo')
  @ApiOperation({
    summary: 'Detach memo from outbound DO',
    description: 'Jika memoId tidak disediakan, semua memo akan dilepas dari outbound DO'
  })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiQuery({
    name: 'memoId',
    description: 'ID memo yang akan dilepas (opsional, jika tidak disediakan semua memo akan dilepas)',
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Memo berhasil dilepas dari outbound DO',
    type: OutboundDoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Memo ID tidak valid atau memo tidak ditemukan dalam outbound DO',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Memo not found in outbound DO' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async detachMemo(@Param('id') id: string, @Query('memoId') memoId?: string) {
    return this.outboundDoService.removeMemo(id, memoId);
  }

  // attach memo to outbound do
  @Patch(':id/attach-memo')
  @ApiOperation({ summary: 'Attach memo to outbound DO' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiQuery({ name: 'memoId', description: 'ID memo yang akan ditambahkan' })
  @ApiQuery({
    name: 'sequence',
    description: 'Sequence number untuk memo (opsional, akan auto-increment jika tidak disediakan)',
    required: false,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Memo berhasil ditambahkan ke outbound DO',
    type: OutboundDoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Memo sudah terattach atau data tidak valid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Memo already attached to outbound DO' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO atau memo tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async attachMemo(
    @Param('id') id: string,
    @Query('memoId') memoId: string,
    @Query('sequence') sequence?: number
  ) {
    const sequenceNumber = sequence ? Number(sequence) : undefined;
    return this.outboundDoService.attachMemo(id, memoId, sequenceNumber);
  }
  // cancel outbound do
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel outbound DO' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 200,
    description: 'Outbound DO berhasil dibatalkan',
    type: OutboundDoResponseDto,
  })
  async cancel(@Param('id') id: string) {
    return this.outboundDoService.cancel(id);
  }

  // integration by outbound do id
  @Post('integration/:id')
  @ApiOperation({ summary: 'Integration by outbound do id' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 200,
    description: 'Integration by outbound do id',
  })
  async integration(@Param('id') id: string) {
    return this.outboundDoService.integration(id);
  }

  // ship confirm internal
  @Post('ship-confirm-internal/:id')
  @ApiOperation({ summary: 'Ship confirm internal' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 200,
    description: 'Ship confirm internal',
  })
  async shipConfirmInternal(
    @Param('id') id: string,
  ) {
    return this.outboundDoService.shipConfirmInternal(id);
  }

  // pick release subdist
  @Post('pick-release-subdist/:id')
  @ApiOperation({ summary: 'Pick release subdist' })
  @ApiBody({ type: [CreateOutboundIntegrationDeliveriesDto] })
  @ApiResponse({
    status: 200,
    description: 'Pick release subdist',
  })
  async pickReleaseSubdist(
    @Body() deliveryDtos: CreateOutboundIntegrationDeliveriesDto[],
  ) {
    return this.outboundDoService.shipConfirmSubdist(deliveryDtos);
  }

  // ship confirm subdist
  @Post('ship-confirm-subdist')
  @ApiOperation({ summary: 'Ship confirm subdist' })
  @ApiBody({ type: [CreateOutboundIntegrationDeliveriesDto] })
  @ApiResponse({
    status: 200,
    description: 'Ship confirm subdist',
  })
  async shipConfirmSubdist(
    @Body() deliveryDtos: CreateOutboundIntegrationDeliveriesDto[],
  ) {
    return this.outboundDoService.shipConfirmSubdist(deliveryDtos);
  }
}
