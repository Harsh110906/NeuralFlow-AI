"use client";

import React from 'react';
import { useSyncExternalStore } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

export const PerformanceReport = React.memo(() => {
  const state = useSyncExternalStore(pricingStore.subscribe, pricingStore.getState, pricingStore.getState);

  return (
    <section className="py-32 bg-[var(--color-card)] border-t border-[var(--color-border)] relative z-10" aria-labelledby="seo-report-title">
      {/* Background noise specifically for this section */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.04%22/%3E%3C/svg%3E')] opacity-50 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--color-border)] pb-8 gap-6">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2">
              <img src="/svgs/chart-pie.svg" className="w-4 h-4 invert opacity-50" /> STATISTICS
            </div>
            <h2 id="seo-report-title" className="text-3xl md:text-5xl font-bold text-white max-w-xl leading-tight">
              Quantifiable impact across every deployment.
            </h2>
          </div>
          <button className="px-6 py-3 border border-[var(--color-border)] text-white hover:bg-[var(--color-background)] rounded transition-micro font-mono text-xs flex items-center gap-3 w-fit">
            <span className="text-primary">&gt;</span> View Report
          </button>
        </header>

        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          <article className="flex flex-col border-l border-[var(--color-border)] pl-8">
            <h3 className="text-6xl md:text-8xl font-bold text-white mb-6 font-mono tracking-tighter">11<span className="text-3xl md:text-4xl text-primary">ms</span></h3>
            <p className="text-[var(--color-muted-foreground)] font-sans">Average latency for real-time inference across Mumbai (INR) endpoints.</p>
            <div className="mt-8 flex gap-1 items-end h-12">
              {[40, 25, 60, 30, 80, 45, 20, 50, 70, 35].map((h, i) => (
                <div key={i} className={`w-2 bg-[var(--color-border)] rounded-t transition-micro ${state.currency === 'INR' ? 'bg-primary' : ''}`} style={{height: `${h}%`}}></div>
              ))}
            </div>
          </article>

          <article className="flex flex-col border-l border-[var(--color-border)] pl-8">
            <h3 className="text-6xl md:text-8xl font-bold text-white mb-6 font-mono tracking-tighter">9<span className="text-3xl md:text-4xl text-secondary">x</span></h3>
            <p className="text-[var(--color-muted-foreground)] font-sans">Increase in manual task processing speed over US (Virginia) routing.</p>
            <div className="mt-8 flex gap-1 items-end h-12">
              {[20, 30, 45, 35, 50, 65, 80, 55, 90, 100].map((h, i) => (
                <div key={i} className={`w-2 bg-[var(--color-border)] rounded-t transition-micro ${state.currency === 'USD' ? 'bg-secondary' : ''}`} style={{height: `${h}%`}}></div>
              ))}
            </div>
          </article>

          <article className="flex flex-col border-l border-[var(--color-border)] pl-8">
            <h3 className="text-6xl md:text-8xl font-bold text-white mb-6 font-mono tracking-tighter">87<span className="text-3xl md:text-4xl text-white">%</span></h3>
            <p className="text-[var(--color-muted-foreground)] font-sans">Uptime for critical agent infrastructure within GDPR (Frankfurt) zones.</p>
            <div className="mt-8 flex gap-1 items-end h-12">
              {[80, 85, 82, 88, 86, 89, 87, 90, 88, 87].map((h, i) => (
                <div key={i} className={`w-2 bg-[var(--color-border)] rounded-t transition-micro ${state.currency === 'EUR' ? 'bg-white' : ''}`} style={{height: `${h}%`}}></div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
});
PerformanceReport.displayName = 'PerformanceReport';
