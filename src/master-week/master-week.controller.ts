import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MasterWeekService } from './master-week.service';
import { CreateMasterWeekDto } from './dto/create-master-week.dto';
import { UpdateMasterWeekDto } from './dto/update-master-week.dto';
import { MasterWeek } from '../core/domain/entities/master-week.entity';

@ApiTags('Master Week')
@Controller('master-week')
@ApiBearerAuth('JWT-auth')
export class MasterWeekController {
  constructor(
    private readonly masterWeekService: MasterWeekService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Week' })
  @ApiResponse({
    status: 201,
    description: 'The Week has been successfully created.',
    type: MasterWeek,
  })
  @ApiResponse({
    status: 409,
    description: 'Week with this code already exists.',
  })
  create(@Body() createMasterWeekDto: CreateMasterWeekDto) {
    return this.masterWeekService.create(createMasterWeekDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Weeks' })
  @ApiResponse({
    status: 200,
    description: 'Return all Weeks.',
    type: [MasterWeek],
  })
  findAll() {
    return this.masterWeekService.findAll();
  }

  // find week by date
  @Get('find-by-date')
  @ApiOperation({ summary: 'Get Week by date' })
  @ApiResponse({
    status: 200,
    description: 'Return Week by date.',
    type: [MasterWeek],
  })
  findByDate(@Query('date') date: Date) {
    return this.masterWeekService.findByDate(date);
  }

  @Get('sync-from-meta-oracle/:tahun')
  @ApiOperation({ summary: 'Sync from meta oracle' })
  @ApiResponse({ status: 200, description: 'Sync from meta oracle' })
  @ApiParam({
    name: 'tahun',
    description: 'Year to filter by',
    example: '2024',
    type: String,
  })
  syncFromMetaOracle(@Param('tahun') year: string) {
    return this.masterWeekService.syncFromMetaOracle(year);
  }

  @Get('sales/all')
  @ApiOperation({ summary: 'Get all week sales' })
  @ApiResponse({
    status: 200,
    description: 'Return all week sales.',
  })
  getWeekSalesAll(@Query('tahun') tahun?: string, @Query('search') search?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const params: { tahun?: string; search?: string; page?: number; limit?: number } = {};
    
    if (tahun) params.tahun = tahun;
    if (search) params.search = search;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    
    return this.masterWeekService.getWeekSalesAll(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Week by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Week.',
    type: MasterWeek,
  })
  @ApiResponse({ status: 404, description: 'Week not found.' })
  findOne(@Param('id') id: string) {
    return this.masterWeekService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Week' })
  @ApiResponse({
    status: 200,
    description: 'The Week has been successfully updated.',
    type: MasterWeek,
  })
  @ApiResponse({ status: 404, description: 'Week not found.' })
  @ApiResponse({
    status: 409,
    description: 'Week with this code already exists.',
  })
  update(
    @Param('id') id: string,
    @Body() updateMasterWeekDto: UpdateMasterWeekDto,
  ) {
    return this.masterWeekService.update(id, updateMasterWeekDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Week' })
  @ApiResponse({
    status: 200,
    description: 'The Week has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Week not found.' })
  remove(@Param('id') id: string) {
    return this.masterWeekService.remove(id);
  }

}
