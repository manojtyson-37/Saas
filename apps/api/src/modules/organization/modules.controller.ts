import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsString, MaxLength } from 'class-validator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { ModulesService } from './modules.service';

class SetModuleDto {
  @ApiProperty({ example: 'hotel' })
  @IsString()
  @MaxLength(30)
  moduleCode!: string;

  @ApiProperty()
  @IsBoolean()
  active!: boolean;
}

@ApiTags('organization')
@ApiBearerAuth()
@Controller('settings/modules')
export class ModulesController {
  constructor(private readonly modules: ModulesService) {}

  @Get()
  @RequirePermission('organization.module:manage')
  @ApiOperation({ summary: 'Module activation state for the tenant' })
  list() {
    return this.modules.list();
  }

  @Put()
  @RequirePermission('organization.module:manage')
  @ApiOperation({ summary: 'Activate or deactivate a module' })
  set(@Body() dto: SetModuleDto) {
    return this.modules.setActive(dto.moduleCode, dto.active);
  }
}
