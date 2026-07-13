import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BILLING_PROVIDER, OfflineBillingProvider } from './billing.provider';

@Module({
  controllers: [BillingController],
  providers: [BillingService, { provide: BILLING_PROVIDER, useClass: OfflineBillingProvider }],
  exports: [BillingService],
})
export class BillingModule {}
