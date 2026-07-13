import { Injectable, Logger } from '@nestjs/common';

/**
 * Payment-provider abstraction. `change-plan` and the trial/status lifecycle
 * only ever talk to this interface — swapping `OfflineBillingProvider` for a
 * Razorpay-backed implementation later is a one-line DI change, not a rewrite.
 */
export interface CreateSubscriptionInput {
  tenantId: string;
  planCode: string;
}

export interface BillingProvider {
  /** Starts (or switches) a paid subscription for the tenant with the provider. */
  createSubscription(input: CreateSubscriptionInput): Promise<{ providerRef: string | null }>;

  /** Cancels the tenant's subscription with the provider. */
  cancelSubscription(tenantId: string): Promise<void>;

  /** Verifies an inbound webhook's signature/payload before it is trusted. */
  webhookVerify(payload: unknown, signature: string | undefined): boolean;
}

export const BILLING_PROVIDER = Symbol('BILLING_PROVIDER');

/**
 * No-op provider used until a real payment gateway is wired in. It marks
 * subscription state directly (no external call, no webhook to verify) so
 * the rest of the billing flow works end-to-end in dev/test/self-serve.
 */
@Injectable()
export class OfflineBillingProvider implements BillingProvider {
  private readonly logger = new Logger(OfflineBillingProvider.name);

  async createSubscription(input: CreateSubscriptionInput): Promise<{ providerRef: string | null }> {
    this.logger.log(`Offline provider: marking tenant ${input.tenantId} subscribed to ${input.planCode}`);
    return { providerRef: null };
  }

  async cancelSubscription(tenantId: string): Promise<void> {
    this.logger.log(`Offline provider: marking tenant ${tenantId} subscription cancelled`);
  }

  webhookVerify(): boolean {
    // No external provider configured — there is no webhook to verify.
    return false;
  }
}
