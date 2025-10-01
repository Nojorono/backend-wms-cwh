import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MasterPalletService } from './master-pallet.service';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import { PalletQuantityHistoryResponseDto, PalletCapacityValidationDto, PalletItemQuantityDto, UpdatePalletQuantityDto } from './dto/pallet-quantity.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';

@ApiTags('Master Pallet')
@Controller('master-pallet')
@ApiBearerAuth('JWT-auth')
export class MasterPalletController {
  constructor(private readonly masterPalletService: MasterPalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new UOM' })
  @ApiResponse({
    status: 201,
    description: 'The Pallet has been successfully created.',
    type: MasterPallet,
  })
  @ApiResponse({
    status: 409,
    description: 'Pallet with this code already exists.',
  })
  create(@Body() createMasterPalletDto: CreateMasterPalletDto) {
    return this.masterPalletService.create(createMasterPalletDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Pallets' })
  @ApiResponse({
    status: 200,
    description: 'Return all Pallets.',
    type: [MasterPallet],
  })
  findAll() {
    return this.masterPalletService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Pallet by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Pallet.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  findOne(@Param('id') id: string) {
    return this.masterPalletService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Pallet' })
  @ApiResponse({
    status: 200,
    description: 'The Pallet has been successfully updated.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  @ApiResponse({
    status: 409,
    description: 'Pallet with this code already exists.',
  })
  update(
    @Param('id') id: string,
    @Body() updateMasterPalletDto: UpdateMasterPalletDto,
  ) {
    return this.masterPalletService.update(id, updateMasterPalletDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Pallet' })
  @ApiResponse({
    status: 200,
    description: 'The Pallet has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  remove(@Param('id') id: string) {
    return this.masterPalletService.remove(id);
  }

  @Patch(':palletCode/quantity')
  @ApiOperation({ summary: 'Update pallet quantity' })
  @ApiResponse({
    status: 200,
    description: 'The Pallet quantity has been successfully updated.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  updateQuantity(@Param('palletCode') palletCode: string, @Body() updateQuantityDto: UpdatePalletQuantityDto) {
    return this.masterPalletService.updateQuantityByPalletCode(palletCode, updateQuantityDto);
  }

  @Get('by-code/:palletCode/quantity-history')
  @ApiOperation({ summary: 'Get pallet quantity history by pallet code' })
  @ApiResponse({
    status: 200,
    description: 'Return pallet quantity history.',
    type: [PalletQuantityHistoryResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  getQuantityHistoryByPalletCode(@Param('palletCode') palletCode: string) {
    return this.masterPalletService.getQuantityHistoryByPalletCode(palletCode);
  }

  @Get('by-code/:palletCode/current')
  @ApiOperation({ summary: 'Get all items and their quantities on a pallet by pallet code' })
  @ApiResponse({
    status: 200,
    description: 'Return all items and their quantities on the pallet.',
    type: [PalletItemQuantityDto],
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  getPalletItemLatestQuantityByPalletCode(@Param('palletCode') palletCode: string) {
    return this.masterPalletService.getPalletItemLatestQuantityByPalletCode(palletCode);
  }

  @Get('by-code/:palletCode/capacity-validation')
  @ApiOperation({ summary: 'Validate pallet capacity by pallet code' })
  @ApiResponse({
    status: 200,
    description: 'Return pallet capacity validation information.',
    type: PalletCapacityValidationDto,
  })
  @ApiResponse({ status: 400, description: 'Pallet capacity not set.' })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  validateCapacityByPalletCode(@Param('palletCode') palletCode: string) {
    return this.masterPalletService.validateCapacityByPalletCode(palletCode);
  }
}
