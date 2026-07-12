import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AssetsService } from './assets.service';
import {
  AssetQueryDto,
  CreateAmcDto,
  CreateAssetDto,
  CreateMaintenanceTicketDto,
  RunDepreciationDto,
  UpdateAssetDto,
  UpdateMaintenanceTicketDto,
} from './dto/assets.dto';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  // ─── Assets ────────────────────────────────────────────────────────────────

  @Post()
  @RequirePermission('assets.asset:manage')
  @ApiOperation({ summary: 'Register an asset' })
  createAsset(@Body() dto: CreateAssetDto) {
    return this.service.createAsset(dto);
  }

  @Get()
  @RequirePermission('assets.asset:read')
  @ApiOperation({ summary: 'List assets' })
  listAssets(@Query() dto: AssetQueryDto) {
    return this.service.listAssets(dto);
  }

  @Get(':id')
  @RequirePermission('assets.asset:read')
  @ApiOperation({ summary: 'Get asset with depreciation history, AMC and open tickets' })
  getAsset(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getAsset(id);
  }

  @Patch(':id')
  @RequirePermission('assets.asset:manage')
  @ApiOperation({ summary: 'Update asset' })
  updateAsset(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateAssetDto) {
    return this.service.updateAsset(id, dto);
  }

  // ─── Depreciation ──────────────────────────────────────────────────────────

  @Post('depreciation/run')
  @RequirePermission('assets.depreciation:run')
  @ApiOperation({ summary: 'Run monthly depreciation for a company period (idempotent)' })
  runDepreciation(@Body() dto: RunDepreciationDto) {
    return this.service.runDepreciation(dto);
  }

  // ─── AMC Contracts ─────────────────────────────────────────────────────────

  @Post('amc')
  @RequirePermission('assets.amc:manage')
  @ApiOperation({ summary: 'Create AMC contract' })
  createAmc(@Body() dto: CreateAmcDto) {
    return this.service.createAmc(dto);
  }

  @Get('amc/renewals')
  @RequirePermission('assets.amc:manage')
  @ApiOperation({ summary: 'List AMC contracts expiring within N days' })
  upcomingRenewals(@Query('days') days?: string) {
    return this.service.upcomingAmcRenewals(days ? parseInt(days, 10) : 30);
  }

  @Get(':assetId/amc')
  @RequirePermission('assets.amc:manage')
  @ApiOperation({ summary: 'List AMC contracts for an asset' })
  listAmcs(@Param('assetId', new ParseUUIDPipe()) assetId: string) {
    return this.service.listAmcs(assetId);
  }

  // ─── Maintenance Tickets ───────────────────────────────────────────────────

  @Post('maintenance')
  @RequirePermission('assets.maintenance:manage')
  @ApiOperation({ summary: 'Create maintenance ticket' })
  createTicket(@Body() dto: CreateMaintenanceTicketDto) {
    return this.service.createMaintenanceTicket(dto);
  }

  @Get('maintenance')
  @RequirePermission('assets.maintenance:read')
  @ApiOperation({ summary: 'List maintenance tickets' })
  listTickets(@Query('assetId') assetId?: string) {
    return this.service.listMaintenanceTickets(assetId);
  }

  @Patch('maintenance/:id')
  @RequirePermission('assets.maintenance:manage')
  @ApiOperation({ summary: 'Update maintenance ticket status' })
  updateTicket(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateMaintenanceTicketDto) {
    return this.service.updateMaintenanceTicket(id, dto);
  }
}
