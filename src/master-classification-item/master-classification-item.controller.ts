import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterClassificationItemService } from './master-classification-item.service';
import { CreateMasterClassificationItemDto } from './dto/create-master-classification-item.dto';
import { UpdateMasterClassificationItemDto } from './dto/update-master-classification-item.dto';
import { MasterClassificationItem } from '../core/domain/entities/master-classification-item.entity';

@ApiTags('Master Classification Item')
@Controller('master-classification-item')
@ApiBearerAuth('JWT-auth')
export class MasterClassificationItemController {
  constructor(private readonly masterClassificationItemService: MasterClassificationItemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Classification Item' })
  @ApiResponse({
    status: 201,
    description: 'The Classification Item has been successfully created.',
    type: MasterClassificationItem,
  })
  @ApiResponse({
    status: 409,
    description: 'Classification Item with this code already exists.',
  })
  create(
    @Body()
    createMasterClassificationItemDto: CreateMasterClassificationItemDto,
  ) {
    return this.masterClassificationItemService.create(createMasterClassificationItemDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Classification Items' })
  findAll() {
    return this.masterClassificationItemService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Classification Item by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Classification Item.',
    type: MasterClassificationItem,
  })
  @ApiResponse({ status: 404, description: 'Classification Item not found.' })
  findOne(@Param('id') id: string) {
    return this.masterClassificationItemService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Classification Item' })
  @ApiResponse({
    status: 200,
    description: 'The Classification Item has been successfully updated.',
    type: MasterClassificationItem,
  })
  @ApiResponse({ status: 404, description: 'Classification Item not found.' })
  @ApiResponse({
    status: 409,
    description: 'Classification Item with this code already exists.',
  })
  update(
    @Param('id') id: string,
    @Body()
    updateMasterClassificationItemDto: UpdateMasterClassificationItemDto,
  ) {
    return this.masterClassificationItemService.update(id, updateMasterClassificationItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Classification Item' })
  @ApiResponse({
    status: 200,
    description: 'The Classification Item has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Classification Item not found.' })
  remove(@Param('id') id: string) {
    return this.masterClassificationItemService.remove(id);
  }
}
