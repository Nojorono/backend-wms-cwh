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
import { MasterItemService } from './master-item.service';
import { CreateMasterItemDto } from './dto/create-master-item.dto';
import { UpdateMasterItemDto } from './dto/update-master-item.dto';
import { MasterItem } from '../core/domain/entities/master-item.entity';

@ApiTags('Master Item')
@Controller('master-item')
@ApiBearerAuth('JWT-auth')
export class MasterItemController {
  constructor(private readonly masterItemService: MasterItemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Item' })
  @ApiResponse({
    status: 201,
    description: 'The Item has been successfully created.',
    type: MasterItem,
  })
  @ApiResponse({
    status: 409,
    description: 'Item with this SKU already exists.',
  })
  create(@Body() createMasterItemDto: CreateMasterItemDto) {
    return this.masterItemService.create(createMasterItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Items' })
  @ApiResponse({
    status: 200,
    description: 'Return all Items.',
    type: [MasterItem],
  })
  findAll() {
    return this.masterItemService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Item by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Item.',
    type: MasterItem,
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  findOne(@Param('id') id: string) {
    return this.masterItemService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Item' })
  @ApiResponse({
    status: 200,
    description: 'The Item has been successfully updated.',
    type: MasterItem,
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  @ApiResponse({
    status: 409,
    description: 'Item with this SKU already exists.',
  })
  update(
    @Param('id') id: string,
    @Body() updateMasterItemDto: UpdateMasterItemDto,
  ) {
    return this.masterItemService.update(id, updateMasterItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Item' })
  @ApiResponse({
    status: 200,
    description: 'The Item has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Item not found.' })
  remove(@Param('id') id: string) {
    return this.masterItemService.remove(id);
  }
}
