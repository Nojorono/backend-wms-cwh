import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MoveOrderIntegration } from '../core/domain/entities/move-order-integration.entity';
import { MoveOrderLineIntegration } from '../core/domain/entities/move-order-integration-lines.entity';
import { CreateMoveOrderIntegrationLineDto } from './dto/create-move-order-integration-line.dto';
import { UpdateMoveOrderIntegrationLineDto } from './dto/update-move-order-integration-line.dto';
import {
  MoveOrderIntegrationHeaderWithLines,
  MoveOrderIntegrationQueuedBatchResult,
  MoveOrderIntegrationQueuedResult,
  MoveOrderIntegrationService,
} from './move-order-integration.service';
import { CreateMoveOrderIntegrationPayloadDto } from './dto/create-move-order-integration-payload.dto';
import { UpdateMoveOrderIntegrationPayloadDto } from './dto/update-move-order-integration-payload.dto';
import { MoveOrderWithLinesResponseDto } from './integration/dto/move-order-with-lines-response.dto';
import { MoveOrderIntegrationContextDto } from './dto/move-order-integration-context.dto';
import { MoveOrderIntegrationPollResponseDto } from './dto/move-order-integration-poll-response.dto';
import { MoveOrderIntegrationPaginationQueryDto } from './dto/move-order-integration-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import {
  CreateAndIntegrateMoveOrderPayloadDto,
  SubmitMoveOrderOraclePayloadDto,
} from './dto/submit-move-order-oracle-payload.dto';
import { OrganizationId } from '../core/decorators/organization-id.decorator';

@ApiTags('Move Order Integration')
@ApiBearerAuth('JWT-auth')
@Controller('move-order-integration')
export class MoveOrderIntegrationController {
  constructor(private readonly service: MoveOrderIntegrationService) { }

  @Get()
  @ApiOperation({ summary: 'List move order integration headers with lines (paginated)' })
  @ApiResponse({ status: 200 })
  findAllHeaders(
    @OrganizationId() organizationId: string,
    @Query() query: MoveOrderIntegrationPaginationQueryDto,
  ): Promise<PaginatedResponseDto<MoveOrderIntegrationHeaderWithLines>> {
    return this.service.findAllHeadersPaginated(organizationId, query);
  }

  @Post('submit-oracle')
  @ApiOperation({
    summary: 'Submit move order directly to Oracle via RabbitMQ',
    description: 'Calls RMQ pattern move-order-wms.create on MOVE_ORDER_WMS_SERVICE.',
  })
  @ApiBody({
    type: SubmitMoveOrderOraclePayloadDto,
    isArray: true,
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
    @Body() payload: SubmitMoveOrderOraclePayloadDto | SubmitMoveOrderOraclePayloadDto[],
  ): Promise<MoveOrderWithLinesResponseDto> {
    if (Array.isArray(payload)) {
      const normalized = payload.map((row) => {
        const { userId: _userId, userName: _userName, ...createDto } = row;
        return createDto;
      });
      const userId = payload[0]?.userId;
      const userName = payload[0]?.userName;
      return this.service.submitToOracle(normalized, userId, userName);
    }

    const { userId, userName, ...createDto } = payload;
    return this.service.submitToOracle(createDto, userId, userName);
  }

  @Post('create-and-integrate')
  @ApiOperation({
    summary: 'Persist move order integration then submit to Oracle',
  })
  @ApiBody({
    type: CreateAndIntegrateMoveOrderPayloadDto,
    isArray: true,
    description:
      'Accepts single object or array of objects. Array will be processed sequentially and queued one by one.',
  })
  @ApiResponse({ status: 202 })
  createAndIntegrate(
    @Body() payload: CreateAndIntegrateMoveOrderPayloadDto | CreateAndIntegrateMoveOrderPayloadDto[],
  ): Promise<MoveOrderIntegrationQueuedResult | MoveOrderIntegrationQueuedBatchResult> {
    if (Array.isArray(payload)) {
      const normalized = payload.map((row) => {
        const { userId: _userId, userName: _userName, ...createPayload } = row;
        return createPayload;
      });

      const userId = payload[0]?.userId;
      const userName = payload[0]?.userName;
      return this.service.createAndIntegrateMany(normalized, userId, userName);
    }

    const { userId, userName, ...createPayload } = payload;
    return this.service.createAndIntegrate(createPayload, userId, userName);
  }

  @Get('find-by-source-header-id/:sourceHeaderId')
  @ApiOperation({ summary: 'Get move order integration header by source header ID' })
  @ApiResponse({ status: 200, type: MoveOrderIntegration })
  findBySourceHeaderId(@Param('sourceHeaderId') sourceHeaderId: string) {
    return this.service.findBySourceHeaderId(sourceHeaderId);
  }

  @Get('polling/:id')
  @ApiOperation({
    summary: 'Poll Oracle and sync move order integration status',
    description:
      'Calls move-order-wms.findBySourceHeaderId using source_header_id, updates staging header/lines, and returns current status.',
  })
  @ApiResponse({ status: 200, type: MoveOrderIntegrationPollResponseDto })
  polling(@Param('id') id: string): Promise<MoveOrderIntegrationPollResponseDto> {
    return this.service.polling(id);
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
