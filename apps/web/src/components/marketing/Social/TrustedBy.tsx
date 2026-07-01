"use client";

import React, { useEffect } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

const companies = ["Quantix", "Aether Labs", "NovaCore", "SynthOps", "HyperScale"];

export const TrustedBy = React.memo(() => {
  useEffect(() => {
    pricingStore.trackRender('footer');
  });

  return (
    <section className="py-12 border-y border-[var(--color-border)] bg-[var(--color-background)] relative z-10 shadow-inner">
      <div className="container mx-auto px-4 max-w-6xl text-center">
        <p className="text-sm font-bold text-[var(--color-muted-foreground)] uppercase tracking-widest mb-8 font-mono">Trusted by Industry Leaders</p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 hover:opacity-100 transition-micro">
          {companies.map(company => (
            <div key={company} className="text-xl md:text-2xl font-bold font-mono text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center text-primary text-xs shadow-md shadow-primary/10">
                {company.charAt(0)}
              </span>
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
TrustedBy.displayName = 'TrustedBy';
