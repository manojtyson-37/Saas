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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@aureus/shared';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('permission-catalog')
  @RequirePermission('identity.role:read')
  @ApiOperation({ summary: 'The full permission catalog, for role-builder UIs' })
  catalog() {
    return { permissions: PERMISSIONS };
  }

  @Get()
  @RequirePermission('identity.role:read')
  @ApiOperation({ summary: 'List roles with grants and usage counts' })
  list() {
    return this.roles.list();
  }

  @Get(':id')
  @RequirePermission('identity.role:read')
  @ApiOperation({ summary: 'Get a role' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles.get(id);
  }

  @Post()
  @RequirePermission('identity.role:create')
  @ApiOperation({ summary: 'Create a custom role' })
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Patch(':id')
  @RequirePermission('identity.role:update')
  @ApiOperation({ summary: 'Update a custom role (system roles are immutable)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('identity.role:delete')
  @ApiOperation({ summary: 'Delete an unassigned custom role' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles.remove(id);
  }
}
