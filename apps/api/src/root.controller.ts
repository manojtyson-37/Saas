import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('root')
@Controller({ path: '/', version: VERSION_NEUTRAL })
export class RootController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Service info' })
  info() {
    return {
      name: 'Aureus API',
      description: 'Hospitality ERP platform — REST API',
      version: 'v1',
      health: '/api/v1/health',
      docs: '/api/docs',
      base: '/api/v1',
    };
  }
}
