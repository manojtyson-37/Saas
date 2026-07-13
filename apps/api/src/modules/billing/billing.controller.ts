import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { BillingService } from './billing.service';
import { ChangePlanDto } from './dto/billing.dto';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List the commercial plan catalog (no permission required beyond auth)' })
  getPlans() {
    return this.service.getPlans();
  }

  @Get('subscription')
  @ApiOperation({ summary: "Current tenant's plan, status, trial window and module entitlements" })
  getSubscription() {
    return this.service.getSubscription();
  }

  @Post('subscription/change-plan')
  @RequirePermission('billing.subscription:manage')
  @ApiOperation({ summary: 'Change the tenant plan and resync module entitlements' })
  changePlan(@Body() dto: ChangePlanDto) {
    return this.service.changePlan(dto);
  }
}
