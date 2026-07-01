export class BillingSummaryDto {
  // Access and Configuration Context
  billingConfigured: boolean;
  canManageBilling: boolean;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastStripeSyncAt: Date | null;

  // Subscription Details
  planName: string;
  subscriptionStatus:
    'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'none';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;

  // Internal Ledger Truth
  rawTokenUsage: number;
  tokenLimit: number | null;

  // Financial Truth (Stripe)
  hasDefaultPaymentMethod: boolean;
  meteredUsageCostCents: number;
  upcomingInvoiceTotalCents: number;
}
