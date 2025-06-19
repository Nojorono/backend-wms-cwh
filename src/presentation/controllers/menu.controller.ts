import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MenuService } from '../../infrastructure/services/menu.service';
import { CreateMenuDto } from '../../core/application/dtos/menu/create-menu.dto';
import { UpdateMenuDto } from '../../core/application/dtos/menu/update-menu.dto';
import { Public } from '../../infrastructure/decorators/public.decorator';
import { Menu } from '../../core/domain/entities/menu.entity';

@ApiTags('Menu')
@Controller('menu')
@ApiBearerAuth('JWT-auth')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('parent')
  @Public()
  @ApiOperation({ summary: 'Get all parent menu items' })
  @ApiResponse({ status: 200, description: 'Return all parent menu items', type: [Menu] })
  async findAllParent(): Promise<Menu[]> {
    return this.menuService.findAllParent();
  }
  
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiResponse({ status: 200, description: 'Return all menu items', type: [Menu] })
  async findAll(): Promise<Menu[]> {
    return this.menuService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get menu item by ID' })
  @ApiResponse({ status: 200, description: 'Return menu item by ID', type: Menu })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Menu> {
    return this.menuService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new menu item' })
  @ApiResponse({ status: 201, description: 'Menu item created successfully', type: Menu })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createMenuDto: CreateMenuDto): Promise<Menu> {
    return this.menuService.create(createMenuDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update menu item' })
  @ApiResponse({ status: 200, description: 'Menu item updated successfully', type: Menu })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuDto: UpdateMenuDto,
  ): Promise<Menu> {
    return this.menuService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu item' })
  @ApiResponse({ status: 200, description: 'Menu item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Menu item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.menuService.delete(id);
  }
} 