import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { UsersService } from './users.service';
import {
  AssignRoleDto,
  CreateUserDto,
  ListUsersQuery,
  UpdateUserDto,
} from './dto/users.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission('identity.user:read')
  @ApiOperation({ summary: 'List users' })
  list(@Query() query: ListUsersQuery) {
    return this.users.list(query);
  }

  @Get(':id')
  @RequirePermission('identity.user:read')
  @ApiOperation({ summary: 'Get a user with role assignments' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.get(id);
  }

  @Post()
  @RequirePermission('identity.user:create')
  @ApiOperation({ summary: 'Create a user (staff account)' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  @RequirePermission('identity.user:update')
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('identity.user:delete')
  @ApiOperation({ summary: 'Soft-delete a user and revoke their sessions' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.remove(id);
  }

  @Post(':id/assignments')
  @RequirePermission('identity.user:assign-role')
  @ApiOperation({ summary: 'Grant a role at tenant/company/location scope' })
  assignRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRoleDto) {
    return this.users.assignRole(id, dto);
  }

  @Delete(':id/assignments/:assignmentId')
  @HttpCode(204)
  @RequirePermission('identity.user:assign-role')
  @ApiOperation({ summary: 'Revoke a role assignment' })
  removeAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
  ) {
    return this.users.removeAssignment(id, assignmentId);
  }
}
