import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckerAssignService } from './checker-assign.service';
import { CreateCheckerAssignDto } from './dto/create-checker-assign.dto';
import { UpdateCheckerAssignDto } from './dto/update-checker-assign.dto';
import { CheckerAssign } from '../core/domain/entities/checker-assign.entity';

@ApiTags('Checker Assign')
@Controller('checker-assign')
@ApiBearerAuth('JWT-auth')
export class CheckerAssignController {
  constructor(private readonly checkerAssignService: CheckerAssignService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Checker Assign' })
  @ApiResponse({ status: 201, description: 'The Checker Assign has been successfully created.', type: CheckerAssign })
  @ApiResponse({ status: 409, description: 'Checker Assign with this inbound plan ID already exists.' })
  create(@Body() createCheckerAssignDto: CreateCheckerAssignDto) {
    return this.checkerAssignService.create(createCheckerAssignDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Checker Assigns' })
  @ApiResponse({ status: 200, description: 'Return all Checker Assigns.', type: [CheckerAssign] })
  findAll() {
    return this.checkerAssignService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Checker Assign by id' })
  @ApiResponse({ status: 200, description: 'Return the Checker Assign.', type: CheckerAssign })
  @ApiResponse({ status: 404, description: 'Checker Assign not found.' })
  findOne(@Param('id') id: string) {
    return this.checkerAssignService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Checker Assign' })
  @ApiResponse({ status: 200, description: 'The Checker Assign has been successfully updated.', type: CheckerAssign })
  @ApiResponse({ status: 404, description: 'Checker Assign not found.' })
  @ApiResponse({ status: 409, description: 'Checker Assign with this inbound plan ID already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateCheckerAssignDto: UpdateCheckerAssignDto,
  ) {
    return this.checkerAssignService.update(id, updateCheckerAssignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Checker Assign' })
  @ApiResponse({ status: 200, description: 'The Checker Assign has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Checker Assign not found.' })
  remove(@Param('id') id: string) {
    return this.checkerAssignService.remove(id);
  }
} 