import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../core/domain/entities/user.entity';

@ApiTags('User')
@Controller('user')
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new User' })
  @ApiResponse({ status: 201, description: 'The User has been successfully created.', type: User })
  @ApiResponse({ status: 409, description: 'User with this code already exists.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Users' })
  @ApiResponse({ status: 200, description: 'Return all Users.', type: [User] })
  findAll() {
      return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a User by id' })
  @ApiResponse({ status: 200, description: 'Return the User.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a User' })
  @ApiResponse({ status: 200, description: 'The User has been successfully updated.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 409, description: 'User with this code already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a User' })
  @ApiResponse({ status: 200, description: 'The User has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
} 