import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';

/** Organization bounded context: tenant hierarchy + module activation. */
@Module({
  controllers: [OrganizationController, ModulesController],
  providers: [OrganizationService, ModulesService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
