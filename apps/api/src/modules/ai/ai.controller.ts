import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AiService } from './ai.service';
import type { AnomalyDetectionDto, NlQueryDto, RevenueForecastDto } from './dto/ai.dto';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('query')
  @RequirePermission('ai.query:run')
  @ApiOperation({ summary: 'Run a natural-language analytics query' })
  naturalLanguageQuery(@Body() dto: NlQueryDto) {
    return this.service.naturalLanguageQuery(dto);
  }

  @Get('forecast')
  @RequirePermission('ai.forecast:read')
  @ApiOperation({ summary: 'Get revenue forecast (moving-average + trend)' })
  revenueForecast(@Query() dto: RevenueForecastDto) {
    return this.service.revenueForecast(dto);
  }

  @Get('anomalies')
  @RequirePermission('ai.anomaly:read')
  @ApiOperation({ summary: 'Detect revenue anomalies using Z-score over daily revenue' })
  detectAnomalies(@Query() dto: AnomalyDetectionDto) {
    return this.service.detectAnomalies(dto);
  }
}
