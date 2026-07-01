"use client";

import React, { useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

const pricingMatrix = {
  starter: { baseRate: 29 },
  growth: { baseRate: 99 },
  enterprise: { baseRate: 299 }
};

const currencyMultipliers = {
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 },
  INR: { symbol: '₹', rate: 83 }
};

const annualDiscount = 0.8;

const DynamicPriceNode = React.memo(({ tier }: { tier: keyof typeof pricingMatrix }) => {
  const state = useSyncExternalStore(pricingStore.subscribe, pricingStore.getState, pricingStore.getState);
  
  const base = pricingMatrix[tier].baseRate;
  const currencyData = currencyMultipliers[state.currency];
  const cycleMultiplier = state.cycle === 'annual' ? annualDiscount : 1;
  
  const finalPrice = Math.round(base * currencyData.rate * cycleMultiplier);
  
  return (
    <div className="flex flex-col">
      <div className="flex items-end gap-1">
        <span className="text-4xl font-bold tracking-tight text-white transition-micro">
          {currencyData.symbol}{finalPrice}
        </span>
        <span className="text-[var(--color-muted-foreground)] mb-1 font-mono">/mo</span>
      </div>
      
      <div className="mt-4 text-xs font-mono text-[var(--color-muted-foreground)] bg-[var(--color-background)] p-3 rounded border border-[var(--color-border)] overflow-hidden">
        <div className="text-[var(--color-foreground)] mb-2 font-semibold">Calculation Pipeline</div>
        <div className="flex justify-between items-center opacity-70">
          <span>Base Rate</span>
          <span>${base}</span>
        </div>
        <div className="flex justify-center my-1 text-[8px] opacity-50">↓</div>
        <div className="flex justify-between items-center opacity-70">
          <span>Regional ({state.currency})</span>
          <span>x{currencyData.rate}</span>
        </div>
        <div className="flex justify-center my-1 text-[8px] opacity-50">↓</div>
        <div className="flex justify-between items-center opacity-70">
          <span>Cycle ({state.cycle})</span>
          <span>{state.cycle === 'annual' ? '-20%' : 'None'}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex justify-between font-bold text-primary">
          <span>Final</span>
          <span>{currencyData.symbol}{finalPrice}</span>
        </div>
      </div>
    </div>
  );
});
DynamicPriceNode.displayName = 'DynamicPriceNode';

const PricingControls = React.memo(() => {
  const state = useSyncExternalStore(pricingStore.subscribe, pricingStore.getState, pricingStore.getState);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-12">
      <div className="flex bg-[var(--color-card)] border border-[var(--color-border)] p-1 rounded-lg">
        {(['USD', 'EUR', 'INR'] as const).map(c => (
          <button
            key={c}
            onClick={() => pricingStore.setCurrency(c)}
            className={`px-4 py-2 rounded-md text-sm font-mono font-bold transition-micro ${state.currency === c ? 'bg-primary text-[var(--color-primary-foreground)]' : 'text-[var(--color-muted-foreground)] hover:text-white'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex bg-[var(--color-card)] border border-[var(--color-border)] p-1 rounded-lg">
        <button
          onClick={() => pricingStore.setCycle('monthly')}
          className={`px-4 py-2 rounded-md text-sm font-mono font-bold transition-micro ${state.cycle === 'monthly' ? 'bg-primary text-[var(--color-primary-foreground)]' : 'text-[var(--color-muted-foreground)] hover:text-white'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => pricingStore.setCycle('annual')}
          className={`px-4 py-2 rounded-md text-sm font-mono font-bold transition-micro flex items-center gap-2 ${state.cycle === 'annual' ? 'bg-primary text-[var(--color-primary-foreground)]' : 'text-[var(--color-muted-foreground)] hover:text-white'}`}
        >
          Annual <span className="bg-secondary/20 text-secondary text-[10px] px-2 py-0.5 rounded-full">-20%</span>
        </button>
      </div>
    </div>
  );
});
PricingControls.displayName = 'PricingControls';

export const PricingEngine = React.memo(() => {
  useEffect(() => {
    pricingStore.trackRender('pricing');
  });

  return (
    <section id="pricing" className="py-24 relative z-10" aria-label="Pricing Engine">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Scale Autonomously</h2>
          <p className="text-[var(--color-muted-foreground)] font-mono text-sm max-w-2xl mx-auto">Multidimensional pricing designed for enterprise workloads.</p>
        </div>
        
        <PricingControls />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-transparent border border-[var(--color-border)] p-8 rounded-2xl relative">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6">For emerging AI operations.</p>
            <DynamicPriceNode tier="starter" />
            <ul className="mt-8 space-y-3 text-sm text-[var(--color-muted-foreground)]">
              <li className="flex items-center gap-2"><img src="/svgs/search.svg" className="w-4 h-4 invert opacity-50" /> 100k Workflows/mo</li>
              <li className="flex items-center gap-2"><img src="/svgs/search.svg" className="w-4 h-4 invert opacity-50" /> Standard Observability</li>
              <li className="flex items-center gap-2 opacity-50"><img src="/svgs/x-mark.svg" className="w-4 h-4 invert" /> Multi-Region Routing</li>
            </ul>
          </div>
          
          <div className="bg-[var(--color-card)] border border-primary p-8 rounded-2xl relative transform scale-105 shadow-[0_0_30px_rgba(255,200,1,0.1)]">
            <div className="absolute top-0 right-0 bg-primary text-[var(--color-primary-foreground)] text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
              RECOMMENDED
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Growth</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6">For scaling autonomous systems.</p>
            <DynamicPriceNode tier="growth" />
            <ul className="mt-8 space-y-3 text-sm text-[var(--color-foreground)]">
              <li className="flex items-center gap-2"><img src="/svgs/search.svg" className="w-4 h-4 invert" /> 1M Workflows/mo</li>
              <li className="flex items-center gap-2"><img src="/svgs/search.svg" className="w-4 h-4 invert" /> Advanced Observability</li>
              <li className="flex items-center gap-2"><img src="/svgs/search.svg" className="w-4 h-4 invert" /> Global Network Routing</li>
            </ul>
          </div>

          <div className="bg-transparent border border-[var(--color-border)] p-8 rounded-2xl relative">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6">For unbounded orchestration.</p>
            <DynamicPriceNode tier="enterprise" />
            <ul className="mt-8 space-y-3 text-sm text-[var(--color-muted-foreground)]">
              <li className="flex items-center gap-2"><img src="/svgs/search.svg" className="w-4 h-4 invert opacity-50" /> Unlimited Workflows</li>
              <li className="flex items-center gap-2"><img src="/svgs/search.svg" className="w-4 h-4 invert opacity-50" /> Custom Edge Clusters</li>
              <li className="flex items-center gap-2"><img src="/svgs/search.svg" className="w-4 h-4 invert opacity-50" /> Dedicated Support</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
});
PricingEngine.displayName = 'PricingEngine';
