import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DoSuggestion } from '../core/domain/entities/do-suggestion.entity';
import { DoSuggestionService } from './do-suggestion.service';
import { BatchCreateOrUpdateDoSuggestionDto } from './dto/batch-create-or-update-do-suggestion.dto';
import { CreateOrUpdateDoSuggestionDto } from './dto/create-or-update-do-suggestion.dto';
import { FindDoSuggestionByCallplanDto } from './dto/find-do-suggestion-by-callplan.dto';
import {
  DoSuggestionCallplanFilterQueryDto,
  DoSuggestionFilterQueryDto,
} from './dto/do-suggestion-filter-query.dto';
import { CreateDoDmsDto } from './dto/create-do-dms.dto';
import { VoidDoDmsDto } from './dto/void-do-dms.dto';
import { CreateDummyDataDoSuggestionQueryDto } from './dto/create-dummy-data-do-suggestion-query.dto';
import { HitDmsBkbDto } from './dto/hit-dms-bkb.dto';
import { HitDmsBkbResult } from './dto/dms-bkb-payload.dto';
import { DmsIntegrationAuth } from '../core/decorators/dms-integration-auth.decorator';

@ApiTags('DO Suggestion')
@Controller('do-suggestion')
@ApiBearerAuth('JWT-auth')
export class DoSuggestionController {
  constructor(private readonly doSuggestionService: DoSuggestionService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update DO suggestion with lines',
    description:
      'Omit `id` to create. Include `id` to partially update header and provided detail lines only. ' +
      '`created_by` / `updated_by` accept employee NIK (varchar).',
  })
  @ApiResponse({ status: 200, type: DoSuggestion })
  createOrUpdate(@Body() dto: CreateOrUpdateDoSuggestionDto): Promise<DoSuggestion> {
    return this.doSuggestionService.createOrUpdate(dto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch create or update DO suggestions',
    description:
      'Processes up to 50 DO suggestions in a single request, sequentially, to avoid concurrent DB load. ' +
      'Use this instead of many parallel POST /do-suggestion calls from the client.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '50 DO suggestion(s) processed successfully' },
        data: { type: 'array', items: { $ref: '#/components/schemas/DoSuggestion' } },
      },
    },
  })
  createOrUpdateBatch(@Body() dto: BatchCreateOrUpdateDoSuggestionDto) {
    return this.doSuggestionService.createOrUpdateBatch(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all DO suggestions with details' })
  @ApiResponse({ status: 200, type: [DoSuggestion] })
  findAll(@Query() query: DoSuggestionFilterQueryDto): Promise<DoSuggestion[]> {
    return this.doSuggestionService.findAll(query.status);
  }

  @Get('callplan/date-start/:callplanDateStart/organization/:organizationId')
  @ApiOperation({
    summary: 'Get DO suggestions by callplan date start and organization ID',
    description:
      'Optional query: sales_spv_nik, status (DRAFT | REVISED | SUBMITTED | FINAL | VOID).',
  })
  @ApiResponse({ status: 200, type: [DoSuggestion] })
  findByCallplanDateStart(
    @Param('callplanDateStart') callplanDateStart: string,
    @Param('organizationId') organizationId: string,
    @Query() query: DoSuggestionCallplanFilterQueryDto,
  ): Promise<DoSuggestion[]> {
    return this.doSuggestionService.findByCallplanDateStart(
      callplanDateStart,
      organizationId,
      query.sales_spv_nik,
      query.status,
    );
  }

  // create dummy data do suggestion
  @Post('dummy-data/:organizationId')
  @ApiOperation({ summary: 'Create dummy data do suggestion' })
  @ApiResponse({ status: 200 })
  createDummyDataDoSuggestion(
    @Param('organizationId') organizationId: string,
    @Query() query: CreateDummyDataDoSuggestionQueryDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.doSuggestionService.createDummyDataDoSuggestion(organizationId, query.mo_type);
  }

  @Post('callplan/find')
  @ApiOperation({ summary: 'Get DO suggestions by callplan number (request body)' })
  @ApiResponse({ status: 200, type: [DoSuggestion] })
  findByCallplanNumber(@Body() dto: FindDoSuggestionByCallplanDto): Promise<DoSuggestion[]> {
    return this.doSuggestionService.findByCallplanNumber(dto.callplanNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get DO suggestion by ID with details' })
  @ApiResponse({ status: 200, type: DoSuggestion })
  findOne(@Param('id') id: string): Promise<DoSuggestion> {
    return this.doSuggestionService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete DO suggestion' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.doSuggestionService.remove(id);
  }

  @Post(':id/integrate')
  @ApiOperation({ summary: 'Integrate move order by DO suggestion ID' })
  @ApiResponse({ status: 200 })
  integrateMoveOrder(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.doSuggestionService.integrateMoveOrder(id);
  }

  @Post(':id/integrate/git')
  @ApiOperation({ summary: 'Integrate move order by DO suggestion ID v2' })
  @ApiResponse({ status: 200 })
  integrateMoveOrderGIT(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.doSuggestionService.integrateMoveOrderGIT(id);
  }

  // integrate revert back to subinventory KECIL
  @Post(':id/integrate/kecil')
  @ApiOperation({ summary: 'Integrate DO suggestion by DO suggestion ID to subinventory KECIL' })
  @ApiResponse({ status: 200 })
  integrateBackToKecil(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.doSuggestionService.integrateBackToKecil(id);
  }

  // hit to dms /api/wms/v1/bkb
  @Post('dms/bkb')
  @ApiOperation({ summary: 'Send DO suggestion BKB to DMS by SPB number' })
  @ApiResponse({ status: 200 })
  hitToDmsBkb(@Body() dto: HitDmsBkbDto): Promise<HitDmsBkbResult> {
    return this.doSuggestionService.hitToDmsBkb(dto.spb_number);
  }

  @Post('dms')
  @DmsIntegrationAuth()
  @ApiOperation({
    summary: 'Create DO suggestion by DMS',
    description:
      'Auth option 1 (recommended): send headers `x-dms-app-id` and `x-dms-app-secret` from environment. ' +
      'Auth option 2: send `Authorization: Bearer <token>` from POST /auth/dms/token.',
  })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Invalid DMS integration credentials or token' })
  createDoDms(@Body() dto: CreateDoDmsDto): Promise<DoSuggestion> {
    return this.doSuggestionService.createDoDms(dto);
  }

  @Post('dms/void')
  @DmsIntegrationAuth()
  @ApiOperation({
    summary: 'Void DO suggestion by DMS (update status to VOID)',
    description:
      'Sets DO suggestion status to VOID by unique `spb_number`. ' +
      'Auth option 1 (recommended): send headers `x-dms-app-id` and `x-dms-app-secret` from environment. ' +
      'Auth option 2: send `Authorization: Bearer <token>` from POST /auth/dms/token.',
  })
  @ApiResponse({ status: 200, type: DoSuggestion })
  @ApiResponse({ status: 401, description: 'Invalid DMS integration credentials or token' })
  @ApiResponse({ status: 404, description: 'DO suggestion with given SPB number not found' })
  voidDoDms(@Body() dto: VoidDoDmsDto): Promise<DoSuggestion> {
    return this.doSuggestionService.voidDoDms(dto);
  }
}
