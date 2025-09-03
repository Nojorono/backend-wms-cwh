import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterPalletService } from './master-pallet.service';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';

@ApiTags('Master Pallet')
@Controller('master-pallet')
@ApiBearerAuth('JWT-auth')
export class MasterPalletController {
  constructor(private readonly masterPalletService: MasterPalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new UOM' })
  @ApiResponse({ status: 201, description: 'The Pallet has been successfully created.', type: MasterPallet })
  @ApiResponse({ status: 409, description: 'Pallet with this code already exists.' })
  create(@Body() createMasterPalletDto: CreateMasterPalletDto) {
    return this.masterPalletService.create(createMasterPalletDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Pallets' })
  @ApiResponse({ status: 200, description: 'Return all Pallets.', type: [MasterPallet] })
  findAll() {
    return this.masterPalletService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Pallet by id' })
  @ApiResponse({ status: 200, description: 'Return the Pallet.', type: MasterPallet })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.masterPalletService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Pallet' })
  @ApiResponse({ status: 200, description: 'The Pallet has been successfully updated.', type: MasterPallet })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  @ApiResponse({ status: 409, description: 'Pallet with this code already exists.' })
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateMasterPalletDto: UpdateMasterPalletDto,
  ) {
    return this.masterPalletService.update(id, updateMasterPalletDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Pallet' })
  @ApiResponse({ status: 200, description: 'The Pallet has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.masterPalletService.remove(id);
  }
} 