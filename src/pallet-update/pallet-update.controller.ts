import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PalletUpdateService } from './pallet-update.service';
import { CreateMergePalletDto } from './dto/create-merge-pallet.dto';
import { CreateSplitPalletDto } from './dto/create-split-pallet.dto';
import { CreatePalletUpdateScanDto } from './dto/create-pallet-update-scan.dto';
import { UpdatePalletUpdateScanDto } from './dto/update-pallet-update-scan.dto';
import { PalletUpdateResponseDto } from './dto/pallet-update-response.dto';
import { PalletUpdateScanResponseDto } from './dto/pallet-update-scan-response.dto';
import { PalletUpdatePaginationQueryDto } from './dto/pallet-update-pagination.dto';
import {
  PalletUpdateType,
  PalletUpdateStatus,
} from '../core/domain/entities/pallet-update.entity';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { CreatePalletUpdateDto } from './dto/create-pallet-update.dto';
import { OrganizationId } from '../core/decorators/organization-id.decorator';

@ApiTags('Pallet Update')
@Controller('pallet-update')
@ApiBearerAuth('JWT-auth')
export class PalletUpdateController {
  constructor(private readonly palletUpdateService: PalletUpdateService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new pallet update' })
  @ApiResponse({
    status: 201,
    description: 'The pallet update has been successfully created.',
    type: PalletUpdateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 409, description: 'Pallet update with this update number already exists.' })
  createUpdate(@Body() createPalletUpdateDto: CreatePalletUpdateDto) {
    return this.palletUpdateService.createUpdate(createPalletUpdateDto);
  }

  @Post('/merge')
  @ApiOperation({ summary: 'Create a new pallet update' })
  @ApiResponse({
    status: 201,
    description: 'The pallet update has been successfully created.',
    type: PalletUpdateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 409, description: 'Pallet update with this update number already exists.' })
  createMerge(@Body() createPalletUpdateDto: CreateMergePalletDto) {
    return this.palletUpdateService.createMergeOrSplit(createPalletUpdateDto);
  }

  @Post('/split')
  @ApiOperation({ summary: 'Create a new pallet update' })
  @ApiResponse({
    status: 201,
    description: 'The pallet update has been successfully created.',
    type: PalletUpdateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 409, description: 'Pallet update with this update number already exists.' })
  createSplit(@Body() createPalletUpdateDto: CreateSplitPalletDto) {
    return this.palletUpdateService.createMergeOrSplit(createPalletUpdateDto);
  }

  // delete pallet update
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a pallet update' })
  @ApiResponse({
    status: 200,
    description: 'The pallet update has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Pallet update not found.' })
  deletePalletUpdate(@Param('id') id: string) {
    return this.palletUpdateService.deletePalletUpdate(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pallet updates or search with pagination' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'updateType',
      description: 'Filter pallet updates by update type',
      enum: Object.values(PalletUpdateType),
      required: false,
    },
    {
      name: 'status',
      description: 'Filter pallet updates by status',
      enum: Object.values(PalletUpdateStatus),
      required: false,
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Return all pallet updates or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/PalletUpdateResponseDto' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findAll(
    @Query() paginationQuery: PalletUpdatePaginationQueryDto,
    @OrganizationId() organizationId?: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }

    const hasPaginationParams =
      paginationQuery.search ||
      paginationQuery.page ||
      paginationQuery.limit ||
      paginationQuery.sortBy ||
      paginationQuery.sortOrder ||
      paginationQuery.updateType ||
      paginationQuery.status;

    if (hasPaginationParams) {
      return this.palletUpdateService.findAllPaginated(paginationQuery, organizationId);
    }

    return this.palletUpdateService.findAll(organizationId, paginationQuery.updateType);
  }

  @Get('/approve-split-pallet/:palletUpdateId')
  @ApiOperation({ summary: 'Approve inspection split pallet' })
  @ApiResponse({
    status: 200,
    description: 'Approve inspection split pallet successfully.',
    type: PalletUpdateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pallet update not found.' })
  approveInspectionSplitPallet(@Param('palletUpdateId') palletUpdateId: string, @Query('inspectionByUserId') inspectionByUserId: string) {
    if (!inspectionByUserId) {
      throw new BadRequestException('Inspection by user ID is required');
    }
    return this.palletUpdateService.approveInspectionSplitPallet(palletUpdateId, inspectionByUserId);
  }

  @Get('/approve-merge-pallet/:palletUpdateId')
  @ApiOperation({ summary: 'Approve merge pallet' })
  @ApiResponse({
    status: 200,
    description: 'Approve merge pallet successfully.',
    type: PalletUpdateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pallet update not found.' })
  approveMergePallet(@Param('palletUpdateId') palletUpdateId: string, @Query('inspectionByUserId') inspectionByUserId: string) {
    if (!inspectionByUserId) {
      throw new BadRequestException('Inspection by user ID is required');
    }
    return this.palletUpdateService.approveInspectionMergePallet(palletUpdateId, inspectionByUserId);
  }

  @Get('/scan-done/:palletUpdateId')
  @ApiOperation({ summary: 'Update status scan to done' })
  @ApiResponse({
    status: 200,
    description: 'update status scan to done.',
    type: PalletUpdateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pallet update not found.' })
  updateStatusScanDone(@Param('palletUpdateId') palletUpdateId: string) {
    return this.palletUpdateService.updateStatusScanDone(palletUpdateId);
  }

  // PalletUpdateScan endpoints
  @Post('/scan')
  @ApiOperation({ summary: 'Create a new pallet update scan' })
  @ApiResponse({
    status: 201,
    description: 'The pallet update scan has been successfully created.',
    type: PalletUpdateScanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Pallet update not found.' })
  createScan(@Body() createScanDto: CreatePalletUpdateScanDto) {
    return this.palletUpdateService.createScan(createScanDto);
  }

  @Get('/scan')
  @ApiOperation({ summary: 'Get all pallet update scans' })
  @ApiQuery({
    name: 'palletUpdateId',
    required: false,
    description: 'Filter scans by pallet update ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Return all pallet update scans.',
    type: [PalletUpdateScanResponseDto],
  })
  findAllScans(@Query('palletUpdateId') palletUpdateId?: string) {
    return this.palletUpdateService.findAllScans(palletUpdateId);
  }

  @Get('/scan/:id')
  @ApiOperation({ summary: 'Get a pallet update scan by ID' })
  @ApiParam({ name: 'id', description: 'Scan ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the pallet update scan.',
    type: PalletUpdateScanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Scan not found.' })
  findOneScan(@Param('id') id: string) {
    return this.palletUpdateService.findOneScan(id);
  }

  @Patch('/scan/:id')
  @ApiOperation({ summary: 'Update a pallet update scan' })
  @ApiParam({ name: 'id', description: 'Scan ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The pallet update scan has been successfully updated.',
    type: PalletUpdateScanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Scan not found.' })
  updateScan(
    @Param('id') id: string,
    @Body() updateScanDto: UpdatePalletUpdateScanDto,
  ) {
    return this.palletUpdateService.updateScan(id, updateScanDto);
  }

  @Delete('/scan/:id')
  @ApiOperation({ summary: 'Delete a pallet update scan' })
  @ApiParam({ name: 'id', description: 'Scan ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'The pallet update scan has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Scan not found.' })
  deleteScan(@Param('id') id: string) {
    return this.palletUpdateService.deleteScan(id);
  }
}
