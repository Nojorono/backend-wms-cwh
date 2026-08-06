import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Btb } from '../core/domain/entities/btb.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { BtbService } from './btb.service';
import { CreateBtbDto } from './dto/create-btb.dto';
import { UpdateBtbDto } from './dto/update-btb.dto';
import { BtbPaginationQueryDto } from './dto/btb-pagination.dto';

@ApiTags('BTB')
@ApiBearerAuth('JWT-auth')
@Controller('btb')
export class BtbController {
  constructor(private readonly service: BtbService) { }

  @Post()
  @ApiOperation({ summary: 'Create BTB header with optional detail lines' })
  @ApiResponse({ status: 201, type: Btb })
  @ApiResponse({ status: 409, description: 'BTB number already exists' })
  create(@Body() dto: CreateBtbDto): Promise<Btb> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List BTB records (paginated)' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: BtbPaginationQueryDto): Promise<PaginatedResponseDto<Btb>> {
    return this.service.findAllPaginated(query);
  }

  @Get('by-number/:btbNumber')
  @ApiOperation({ summary: 'Get BTB by btb_number with details' })
  @ApiResponse({ status: 200, type: Btb })
  @ApiResponse({ status: 404, description: 'BTB not found' })
  findByBtbNumber(@Param('btbNumber') btbNumber: string): Promise<Btb> {
    return this.service.findByBtbNumber(btbNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get BTB by ID with details' })
  @ApiResponse({ status: 200, type: Btb })
  @ApiResponse({ status: 404, description: 'BTB not found' })
  findOne(@Param('id') id: string): Promise<Btb> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update BTB header and optionally upsert detail lines',
    description:
      'Partial header update. When `details` is provided, lines with `id` are updated; lines without `id` are created.',
  })
  @ApiResponse({ status: 200, type: Btb })
  @ApiResponse({ status: 404, description: 'BTB not found' })
  update(@Param('id') id: string, @Body() dto: UpdateBtbDto): Promise<Btb> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete BTB header and its detail lines' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.service.remove(id);
  }

  @Delete(':id/details/:detailId')
  @ApiOperation({ summary: 'Soft-delete a single BTB detail line' })
  @ApiResponse({ status: 200 })
  removeDetail(
    @Param('id') id: string,
    @Param('detailId') detailId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.service.removeDetail(id, detailId);
  }

  // create dummy data JAT for btb table from do suggestion table where organization_id = 'db72a8e1-0ca6-4353-b157-9b798f703179'
  @Post('create-dummy-data-jat')
  @ApiOperation({ summary: 'Create dummy data JAT for btb table from do suggestion table' })
  @ApiResponse({ status: 200 })
  createDummyDataJat(): Promise<{ success: boolean; message: string }> {
    return this.service.createDummyDataJat();
  }
}
