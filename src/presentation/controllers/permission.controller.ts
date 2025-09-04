import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionService } from '../../infrastructure/services/permission.service';
import { PermissionDto } from '../../core/application/dtos/permission/create-permission.dto';

@ApiTags('Permissions')
@Controller('permissions')
@ApiBearerAuth('JWT-auth')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'Return all permissions' })
  async findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: 'Return permission by ID' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findOne(@Param('id') id: string) {
    return this.permissionService.findById(+id);
  }

  @Get('role/:roleId')
  @ApiOperation({ summary: 'Get permissions by role ID' })
  @ApiResponse({ status: 200, description: 'Return permissions by role ID' })
  async findByRoleId(@Param('roleId') roleId: string) {
    return this.permissionService.findByRoleId(+roleId);
  }

  @Get('menu/:menuId')
  @ApiOperation({ summary: 'Get permissions by menu ID' })
  @ApiResponse({ status: 200, description: 'Return permissions by menu ID' })
  async findByMenuId(@Param('menuId') menuId: string) {
    return this.permissionService.findByMenuId(+menuId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  async create(@Body() createPermissionDto: PermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: Partial<PermissionDto>,
  ) {
    return this.permissionService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ status: 200, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async remove(@Param('id') id: string) {
    return this.permissionService.delete(+id);
  }

  @Delete('role/:roleId')
  @ApiOperation({ summary: 'Delete all permissions for a role' })
  @ApiResponse({ status: 200, description: 'Permissions deleted successfully' })
  @ApiResponse({ status: 404, description: 'No permissions found for role' })
  async removeByRoleId(@Param('roleId') roleId: string) {
    return this.permissionService.deleteByRoleId(+roleId);
  }
}
