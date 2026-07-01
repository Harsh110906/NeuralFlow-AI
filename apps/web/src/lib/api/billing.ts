export interface BillingSummaryDto {
  billingConfigured: boolean;
  canManageBilling: boolean;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastStripeSyncAt: Date | null;
  
  planName: string;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'none';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  
  rawTokenUsage: number;
  tokenLimit: number | null;
  
  hasDefaultPaymentMethod: boolean;
  meteredUsageCostCents: number;
  upcomingInvoiceTotalCents: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getBillingSummary(workspaceId: string, token: string | null): Promise<BillingSummaryDto> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/summary`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    cache: 'no-store', // Always fetch latest truth from backend
  });

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Forbidden: You do not have permission to view billing for this workspace.');
    }
    throw new Error('Failed to fetch billing summary');
  }

  return res.json();
}

export async function createPortalSession(workspaceId: string, token: string | null): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/portal-session`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });

  if (!res.ok) {
    throw new Error('Failed to create portal session');
  }

  return res.json();
}

export async function getUsageChart(workspaceId: string, token: string | null): Promise<{ data: { date: string, amountUsd: number }[] }> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/usage-chart`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch usage chart');
  return res.json();
}

export async function updateBillingPolicy(
  workspaceId: string,
  updates: { monthlyBudget?: number, softWarningThreshold?: number, hardCutoff?: boolean },
  token: string | null
) {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/policy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update billing policy');
  return res.json();
}

export async function getLedgerHistory(workspaceId: string, token: string | null): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/billing/ledger`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch ledger history');
  return res.json();
}
