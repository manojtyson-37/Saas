import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { BarService } from './bar.service';
import type {
  BarVarianceQueryDto,
  BottleQueryDto,
  OpenBottleDto,
  PourQueryDto,
  RecordPourDto,
  RegisterBottleDto,
  UpdateBottleStatusDto,
} from './dto/bar.dto';

@ApiTags('bar')
@ApiBearerAuth()
@Controller('bar')
export class BarController {
  constructor(private readonly service: BarService) {}

  // ─── Bottles ──────────────────────────────────────────────────────────────────

  @Post('bottles')
  @RequirePermission('bar.bottle:operate')
  @ApiOperation({ summary: 'Register a new bottle' })
  registerBottle(@Body() dto: RegisterBottleDto) {
    return this.service.registerBottle(dto);
  }

  @Get('bottles')
  @RequirePermission('bar.bottle:read')
  @ApiOperation({ summary: 'List bottles with optional filters' })
  listBottles(@Query() dto: BottleQueryDto) {
    return this.service.listBottles(dto);
  }

  @Get('bottles/:id')
  @RequirePermission('bar.bottle:read')
  @ApiOperation({ summary: 'Get bottle with recent pours' })
  getBottle(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getBottle(id);
  }

  @Post('bottles/open')
  @RequirePermission('bar.bottle:operate')
  @ApiOperation({ summary: 'Open a sealed bottle' })
  openBottle(@Body() dto: OpenBottleDto) {
    return this.service.openBottle(dto);
  }

  @Patch('bottles/:id/status')
  @RequirePermission('bar.bottle:operate')
  @ApiOperation({ summary: 'Update bottle status (e.g. mark WRITTEN_OFF)' })
  updateBottleStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBottleStatusDto,
  ) {
    return this.service.updateBottleStatus(id, dto);
  }

  // ─── Pours ────────────────────────────────────────────────────────────────────

  @Post('pours')
  @RequirePermission('bar.bottle:operate')
  @ApiOperation({ summary: 'Record a pour from an open bottle' })
  recordPour(@Body() dto: RecordPourDto) {
    return this.service.recordPour(dto);
  }

  @Get('pours')
  @RequirePermission('bar.bottle:read')
  @ApiOperation({ summary: 'List pour records' })
  listPours(@Query() dto: PourQueryDto) {
    return this.service.listPours(dto);
  }

  // ─── Variance ─────────────────────────────────────────────────────────────────

  @Get('variance')
  @RequirePermission('bar.variance:read')
  @ApiOperation({ summary: 'Get pour variance report by item' })
  getVarianceReport(@Query() dto: BarVarianceQueryDto) {
    return this.service.getVarianceReport(dto);
  }

  // ─── Excise ───────────────────────────────────────────────────────────────────

  @Get('excise')
  @RequirePermission('bar.excise:read')
  @ApiOperation({ summary: 'Get excise summary for a period (YYYY-MM)' })
  getExciseSummary(@Query('period') period: string) {
    return this.service.getExciseSummary(period ?? new Date().toISOString().slice(0, 7));
  }
}
