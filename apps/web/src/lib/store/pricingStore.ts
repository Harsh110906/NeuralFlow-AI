import { useSyncExternalStore } from 'react';

// Using a PubSub pattern for ultimate state isolation.
// This allows pricing changes to NOT trigger React tree re-renders,
// except for the exact components subscribed to this specific store.

type Currency = 'USD' | 'EUR' | 'INR';
type BillingCycle = 'monthly' | 'annual';

interface PricingState {
  currency: Currency;
  cycle: BillingCycle;
  reRenderCounts: Record<string, number>; // Used for the dev tools observatory
}

let state: PricingState = {
  currency: 'USD',
  cycle: 'monthly',
  reRenderCounts: {
    hero: 0,
    features: 0,
    pricing: 0,
    footer: 0,
  }
};

type Listener = () => void;
const listeners = new Set<Listener>();

export const pricingStore = {
  getState: () => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  setCurrency: (newCurrency: Currency) => {
    state = { ...state, currency: newCurrency };
    listeners.forEach((l) => l());
  },
  setCycle: (newCycle: BillingCycle) => {
    state = { ...state, cycle: newCycle };
    listeners.forEach((l) => l());
  },
  trackRender: (component: string) => {
    // Non-mutating state update purely for devtools visualization
    // We don't trigger listeners for this to avoid infinite loops
    state.reRenderCounts[component] = (state.reRenderCounts[component] || 0) + 1;
  }
};

// Custom hook to consume the store
export function usePricing() {
  return useSyncExternalStore(pricingStore.subscribe, pricingStore.getState, pricingStore.getState);
}
