import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkScheduled } from '../core/domain/entities/work-scheduled.entity';
import { CreateWorkScheduledDto } from './dto/create-work-scheduled.dto';
import { GenerateWorkScheduledDto } from './dto/generate-work-scheduled.dto';
import { GetBtbDateQueryDto } from './dto/get-btb-date-query.dto';
import { GetCallplanDateQueryDto } from './dto/get-callplan-date-query.dto';
import { GetCallplanDateSubmittedQueryDto } from './dto/get-callplan-date-submitted-query.dto';
import { NationalHolidayYearQueryDto } from './dto/national-holiday-year-query.dto';
import { ResolveWorkScheduledQueryDto } from './dto/resolve-work-scheduled-query.dto';
import { UpdateWorkScheduledDto } from './dto/update-work-scheduled.dto';
import { WorkScheduledFilterQueryDto } from './dto/work-scheduled-filter-query.dto';
import { BusinessDateResult, WorkScheduledService } from './work-scheduled.service';

@ApiTags('Work Scheduled')
@Controller('work-scheduled')
@ApiBearerAuth('JWT-auth')
export class WorkScheduledController {

  constructor(private readonly workScheduledService: WorkScheduledService) { }

  @Post()
  @ApiOperation({ summary: 'Create calendar entry for a specific date' })
  @ApiResponse({ status: 201, type: WorkScheduled })
  create(@Body() dto: CreateWorkScheduledDto): Promise<WorkScheduled> {
    return this.workScheduledService.create(dto);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate default calendar for a year',
    description:

      'Generate 365/366 hari per tahun. Minggu = WEEKEND, libur nasional (dari API) = HOLIDAY, sisanya WORKING (termasuk Sabtu). ' +

      'Kosongkan organizationId untuk kalender default global.',
  })
  generate(@Body() dto: GenerateWorkScheduledDto) {
    return this.workScheduledService.generateYear(dto);
  }

  @Get('national-holidays')
  @ApiOperation({
    summary: 'Fetch Indonesia national holidays from external API',
    description: 'Sumber: api-hari-libur.vercel.app (gratis, tanpa API key)',
  })
  getNationalHolidays(@Query() query: NationalHolidayYearQueryDto) {
    return this.workScheduledService.getNationalHolidays(query.year);
  }

  @Get('holiday-cache')
  @ApiOperation({ summary: 'List years currently cached from holiday API' })
  getHolidayCacheInfo() {
    return this.workScheduledService.getHolidayCacheInfo();
  }

  @Get('resolve')
  @ApiOperation({
    summary: 'Resolve day type for a date',
    description: 'Prioritas: cabang → default global → fallback weekday',
  })
  resolve(@Query() query: ResolveWorkScheduledQueryDto) {
    return this.workScheduledService.resolveDay(query);
  }

  @Get('callplan-date')
  @ApiOperation({
    summary: 'Get callplan date for sales_supervisor',
    description: 'DO suggestion date (hari ini/baseDate) + 2 hari kerja = call_plan_date',
  })
  @ApiResponse({ status: 200 })
  getCallplanDate(@Query() query: GetCallplanDateQueryDto): Promise<BusinessDateResult> {
    return this.workScheduledService.getCallplanDate(query);
  }

  @Get('callplan-date-submitted')
  @ApiOperation({
    summary: 'Get callplan date submitted for admin_warehouse',
    description:
      'Hari persiapan admin gudang (hari ini) + 1 hari kerja = callplan_date yang harus disiapkan. ' +
      'Contoh: persiapan 4 Juli (libur 5 Juli) → callplan 6 Juli.',

  })
  @ApiResponse({ status: 200 })
  getCallplanDateSubmitted(
    @Query() query: GetCallplanDateSubmittedQueryDto,
  ): Promise<BusinessDateResult> {
    return this.workScheduledService.getCallplanDateSubmitted(query);
  }

  @Get('btb-date')
  @ApiOperation({
    summary: 'Get btb date for admin_warehouse',
    description: 'Hari ini/baseDate - 1 hari kerja = btb_date',
  })

  @ApiResponse({ status: 200 })
  getBtbDate(@Query() query: GetBtbDateQueryDto): Promise<BusinessDateResult> {
    return this.workScheduledService.getBtbDate(query);
  }

  @Get()
  @ApiOperation({ summary: 'List calendar entries with filters' })
  @ApiResponse({ status: 200, type: [WorkScheduled] })
  findAll(@Query() query: WorkScheduledFilterQueryDto): Promise<WorkScheduled[]> {
    return this.workScheduledService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get calendar entry by ID' })
  @ApiResponse({ status: 200, type: WorkScheduled })
  findOne(@Param('id') id: string): Promise<WorkScheduled> {
    return this.workScheduledService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update calendar entry' })
  @ApiResponse({ status: 200, type: WorkScheduled })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkScheduledDto,
  ): Promise<WorkScheduled> {
    return this.workScheduledService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete calendar entry' })
  remove(@Param('id') id: string): Promise<void> {
    return this.workScheduledService.remove(id);
  }

}


