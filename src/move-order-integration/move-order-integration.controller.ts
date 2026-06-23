import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MoveOrderIntegration } from '../core/domain/entities/move-order-integration.entity';
import { MoveOrderLineIntegration } from '../core/domain/entities/move-order-integration-lines.entity';
import { CreateMoveOrderIntegrationLineDto } from './dto/create-move-order-integration-line.dto';
import { UpdateMoveOrderIntegrationLineDto } from './dto/update-move-order-integration-line.dto';
import {
  MoveOrderIntegrationHeaderWithLines,
  MoveOrderIntegrationQueuedResult,
  MoveOrderIntegrationService,
} from './move-order-integration.service';
import { CreateMoveOrderIntegrationPayloadDto } from './dto/create-move-order-integration-payload.dto';
import { UpdateMoveOrderIntegrationPayloadDto } from './dto/update-move-order-integration-payload.dto';
import { MoveOrderWithLinesResponseDto } from './integration/dto/move-order-with-lines-response.dto';
import { MoveOrderIntegrationContextDto } from './dto/move-order-integration-context.dto';
import {
  CreateAndIntegrateMoveOrderPayloadDto,
  SubmitMoveOrderOraclePayloadDto,
} from './dto/submit-move-order-oracle-payload.dto';

@ApiTags('Move Order Integration')
@ApiBearerAuth('JWT-auth')
@Controller('move-order-integration')
export class MoveOrderIntegrationController {
  constructor(private readonly service: MoveOrderIntegrationService) {}

  @Post()
  @ApiOperation({ summary: 'Create move order integration header with optional lines' })
  @ApiResponse({ status: 201 })
  create(@Body() dto: CreateMoveOrderIntegrationPayloadDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List move order integration headers with lines' })
  @ApiResponse({ status: 200 })
  findAllHeaders(): Promise<MoveOrderIntegrationHeaderWithLines[]> {
    return this.service.findAllHeaders();
  }

  @Post('submit-oracle')
  @ApiOperation({
    summary: 'Submit move order directly to Oracle via RabbitMQ',
    description: 'Calls RMQ pattern move_order.create_with_lines on MOVE_ORDER_SERVICE.',
  })
  @ApiBody({
    type: SubmitMoveOrderOraclePayloadDto,
    description: 'Full payload example including optional header and locator fields.',
    examples: {
      fullPayload: {
        summary: 'Complete move order payload',
        value: {
          REQUEST_NUMBER: 'JAT/SPB/2024/01/000002',
          TRANSACTION_TYPE_ID: 121,
          MOVE_ORDER_TYPE: 1,
          ORGANIZATION_ID: 241,
          DATE_REQUIRED: '2024-01-01',
          FROM_SUBINVENTORY_CODE: 'KECIL',
          TO_SUBINVENTORY_CODE: 'CANVAS',
          HEADER_STATUS: 7,
          STATUS_DATE: '2024-01-01',
          ATTRIBUTE_CATEGORY: 'FPPR Tambahan',
          ATTRIBUTE7: 'string',
          ATTRIBUTE8: 'string',
          ATTRIBUTE9: 'string',
          ATTRIBUTE10: 'string',
          ATTRIBUTE11: 'string',
          ATTRIBUTE12: 'string',
          ATTRIBUTE13: 'JAT/CP/2024/01/000001',
          ATTRIBUTE14: 'JAT/SPB/2024/01/000002',
          OPERATION: 'CREATE',
          DB_FLAG: 'T',
          SOURCE_SYSTEM: 'WMS',
          SOURCE_HEADER_ID: '1234567890',
          SOURCE_LINE_ID: '1234567890',
          SOURCE_BATCH_ID: '1234567890',
          IFACE_STATUS: 'READY',
          IFACE_MODE: 'MOVE_ORDER',
          TOTAL_LINES: 1,
          CREATION_DATE: '2024-01-01',
          CREATED_BY: 1234,
          LAST_UPDATE_DATE: '2024-01-01',
          LAST_UPDATED_BY: 1234,
          lines: [
            {
              LINE_NUMBER: 1,
              ORGANIZATION_ID: 241,
              INVENTORY_ITEM_ID: 21001,
              FROM_SUBINVENTORY_CODE: 'KECIL',
              TO_SUBINVENTORY_CODE: 'CANVAS',
              FROM_LOCATOR_ID: 1001,
              TO_LOCATOR_ID: 2001,
              UOM_CODE: 'BKS',
              QUANTITY: 1000,
              DATE_REQUIRED: '2024-01-01',
              TRANSACTION_TYPE_ID: 121,
              TRANSACTION_SOURCE_TYPE_ID: 4,
              LINE_STATUS: 7,
              STATUS_DATE: '2024-01-01',
              LOT_NUMBER: 'LOT-001',
              SOURCE_LINE_ID: '1234567890',
              IFACE_STATUS: 'READY',
              OPERATION: 'CREATE',
              DB_FLAG: 'T',
            },
          ],
          userId: 1234,
          userName: 'John Doe',
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: MoveOrderWithLinesResponseDto })
  submitToOracle(
    @Body() payload: SubmitMoveOrderOraclePayloadDto,
  ): Promise<MoveOrderWithLinesResponseDto> {
    const { userId, userName, ...createDto } = payload;
    return this.service.submitToOracle(createDto, userId, userName);
  }

  @Post('create-and-integrate')
  @ApiOperation({
    summary: 'Persist move order integration then submit to Oracle',
  })
  @ApiResponse({ status: 202 })
  createAndIntegrate(
    @Body() payload: CreateAndIntegrateMoveOrderPayloadDto,
  ): Promise<MoveOrderIntegrationQueuedResult> {
    const { userId, userName, ...createPayload } = payload;
    return this.service.createAndIntegrate(createPayload, userId, userName);
  }

  @Post('lines')
  @ApiOperation({ summary: 'Create move order integration line' })
  @ApiResponse({ status: 201, type: MoveOrderLineIntegration })
  createLine(@Body() dto: CreateMoveOrderIntegrationLineDto) {
    return this.service.createLine(dto);
  }

  @Get('lines/all')
  @ApiOperation({ summary: 'List all move order integration lines' })
  @ApiResponse({ status: 200, type: [MoveOrderLineIntegration] })
  findAllLines() {
    return this.service.findAllLines();
  }

  @Get('lines/:id')
  @ApiOperation({ summary: 'Get move order integration line by ID' })
  @ApiResponse({ status: 200, type: MoveOrderLineIntegration })
  findLineById(@Param('id') id: string) {
    return this.service.findLineById(id);
  }

  @Patch('lines/:id')
  @ApiOperation({ summary: 'Update move order integration line by ID' })
  @ApiResponse({ status: 200, type: MoveOrderLineIntegration })
  updateLine(@Param('id') id: string, @Body() dto: UpdateMoveOrderIntegrationLineDto) {
    return this.service.updateLine(id, dto);
  }

  @Delete('lines/:id')
  @ApiOperation({ summary: 'Soft-delete move order integration line by ID' })
  @ApiResponse({ status: 200 })
  removeLine(@Param('id') id: string) {
    return this.service.removeLine(id);
  }

  @Post(':id/integrate')
  @ApiOperation({
    summary: 'Submit persisted move order integration to Oracle',
    description: 'Maps WMS record to Oracle DTO and calls move_order.create_with_lines.',
  })
  @ApiResponse({ status: 202 })
  integrateById(
    @Param('id') id: string,
    @Body() context?: MoveOrderIntegrationContextDto,
  ): Promise<MoveOrderIntegrationQueuedResult> {
    return this.service.integrateById(id, context?.userId, context?.userName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get move order integration header by ID (with lines)' })
  @ApiResponse({ status: 200, type: MoveOrderIntegration })
  findHeaderById(@Param('id') id: string) {
    return this.service.findHeaderWithLinesById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update header with optional line replacement' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() dto: UpdateMoveOrderIntegrationPayloadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete move order integration header and its lines' })
  @ApiResponse({ status: 200 })
  removeHeader(@Param('id') id: string) {
    return this.service.removeHeader(id);
  }
}
