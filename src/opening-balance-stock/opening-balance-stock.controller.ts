import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import {
  OpeningBalanceStockExcelFile,
  OpeningBalanceStockService,
} from './opening-balance-stock.service';
import { CreateOpeningBalanceStockDto } from './dto/create-opening-balance-stock.dto';
import { UpdateOpeningBalanceStockDto } from './dto/update-opening-balance-stock.dto';
import { OpeningBalanceStockPaginationDto } from './dto/opening-balance-stock-pagination.dto';
import { UploadOpeningBalanceStockExcelDto } from './dto/upload-opening-balance-stock-excel.dto';
import { UpdateOpeningBalanceStockStatusDto } from './dto/update-opening-balance-stock-status.dto';
import { OpeningBalanceStock } from '../core/domain/entities/opening-balance-stock.entity';

@ApiTags('Opening Balance Stock')
@Controller('opening-balance-stock')
@ApiBearerAuth('JWT-auth')
export class OpeningBalanceStockController {
  constructor(private readonly openingBalanceStockService: OpeningBalanceStockService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new opening balance stock (line items referenced by code)' })
  @ApiResponse({ status: 201, description: 'Opening balance stock created.', type: OpeningBalanceStock })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or unknown code.' })
  @ApiResponse({ status: 409, description: 'Opening balance stock with this code already exists.' })
  create(@Body() createDto: CreateOpeningBalanceStockDto) {
    return this.openingBalanceStockService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all opening balance stocks or search with pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiQuery({ name: 'organization_id', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Return all opening balance stocks or paginated results.' })
  findAll(@Query() paginationDto: OpeningBalanceStockPaginationDto) {
    const hasParams =
      paginationDto.search ||
      paginationDto.status ||
      paginationDto.source ||
      paginationDto.organization_id ||
      paginationDto.page ||
      paginationDto.limit ||
      paginationDto.sortBy ||
      paginationDto.sortOrder;

    if (hasParams) {
      return this.openingBalanceStockService.findAllWithPagination(paginationDto);
    }

    return this.openingBalanceStockService.findAll();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all opening balance stocks (no pagination)' })
  @ApiResponse({ status: 200, description: 'Return all opening balance stocks.', type: [OpeningBalanceStock] })
  findAllOpeningBalances() {
    return this.openingBalanceStockService.findAll();
  }

  @Get('template/excel')
  @ApiOperation({ summary: 'Download the opening balance stock Excel template' })
  @ApiResponse({ status: 200, description: 'Excel template file (.xlsx).' })
  downloadTemplate(@Res() res: Response): void {
    const buffer = this.openingBalanceStockService.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="opening-balance-stock-template.xlsx"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('upload-excel')
  @ApiOperation({ summary: 'Import opening balance stock from an Excel file (codes only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        code: { type: 'string' },
        document: { type: 'string' },
        organization_id: { type: 'string' },
        period_date: { type: 'string', example: '2026-01-01' },
        week_number: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Excel parsed and opening balance stock persisted.', type: OpeningBalanceStock })
  @ApiResponse({ status: 400, description: 'Invalid file or unknown code.' })
  @UseInterceptors(FileInterceptor('file'))
  uploadExcel(
    @UploadedFile() file: OpeningBalanceStockExcelFile,
    @Body() body: UploadOpeningBalanceStockExcelDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.openingBalanceStockService.uploadExcel(file, body);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get an opening balance stock by code' })
  @ApiResponse({ status: 200, description: 'Return the opening balance stock.', type: OpeningBalanceStock })
  @ApiResponse({ status: 404, description: 'Opening balance stock not found.' })
  findByCode(@Param('code') code: string) {
    return this.openingBalanceStockService.findByCode(code);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update opening balance stock status' })
  @ApiResponse({ status: 200, description: 'Status updated.', type: OpeningBalanceStock })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  @ApiResponse({ status: 404, description: 'Opening balance stock not found.' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOpeningBalanceStockStatusDto,
  ) {
    return this.openingBalanceStockService.updateStatus(id, dto);
  }

  @Post(':id/confirmed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm opening balance stock (DRAFT → CONFIRMED)',
    description:
      'Resolves line item codes to master records (item, warehouse sub/bin, pallet) then sets status CONFIRMED.',
  })
  @ApiResponse({ status: 200, description: 'Opening balance stock confirmed.', type: OpeningBalanceStock })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  @ApiResponse({ status: 404, description: 'Opening balance stock not found.' })
  confirm(@Param('id') id: string) {
    return this.openingBalanceStockService.confirm(id);
  }

  @Post(':id/cancelled')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel opening balance stock (DRAFT → CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Opening balance stock cancelled.', type: OpeningBalanceStock })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  @ApiResponse({ status: 404, description: 'Opening balance stock not found.' })
  cancel(@Param('id') id: string) {
    return this.openingBalanceStockService.cancel(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an opening balance stock by ID' })
  @ApiResponse({ status: 200, description: 'Return the opening balance stock.', type: OpeningBalanceStock })
  @ApiResponse({ status: 404, description: 'Opening balance stock not found.' })
  findOne(@Param('id') id: string) {
    return this.openingBalanceStockService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an opening balance stock' })
  @ApiResponse({ status: 200, description: 'Opening balance stock updated.', type: OpeningBalanceStock })
  @ApiResponse({ status: 404, description: 'Opening balance stock not found.' })
  @ApiResponse({ status: 409, description: 'Opening balance stock with this code already exists.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateOpeningBalanceStockDto) {
    return this.openingBalanceStockService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an opening balance stock (soft delete)' })
  @ApiResponse({ status: 204, description: 'Opening balance stock deleted.' })
  @ApiResponse({ status: 404, description: 'Opening balance stock not found.' })
  remove(@Param('id') id: string) {
    return this.openingBalanceStockService.remove(id);
  }
}
