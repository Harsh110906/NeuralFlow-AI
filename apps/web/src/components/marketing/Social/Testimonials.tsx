"use client";

import React, { useEffect } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

const caseStudies = [
  {
    company: "Aetna Health",
    quote: "We automated Aetna's member data management using secure AI to provide personalized care and clinical insights. The node-based builder is a game changer.",
    metric: "85%",
    metricLabel: "Reduction in ticket latency",
    rating: 5,
  },
  {
    company: "Cigna Smart Systems",
    quote: "Revolutionizing patient care through predictive analytics and seamless AI-driven diagnostic integration tools. NeuralFlow handles our edge nodes with zero downtime.",
    metric: "400hrs",
    metricLabel: "Saved in monthly R&D",
    rating: 5,
  },
  {
    company: "Anthem Neural",
    quote: "We deployed a custom LLM to automate Anthem's provider relations. The observability tools allow us to monitor agent accuracy in real-time.",
    metric: "99.9%",
    metricLabel: "Precision in every inference",
    rating: 5,
  }
];

export const Testimonials = React.memo(() => {
  useEffect(() => {
    pricingStore.trackRender('testimonials');
  });

  return (
    <section className="py-24 relative z-10 bg-[var(--color-background)]" aria-labelledby="testimonials-title">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <div className="text-[10px] font-mono tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center justify-center gap-2 uppercase">
            <img src="/svgs/cube-16-solid.svg" className="w-4 h-4 invert opacity-50" /> CASE STUDIES
          </div>
          <h2 id="testimonials-title" className="text-4xl md:text-5xl font-bold text-white tracking-tighter">
            Trusted by the pioneers
          </h2>
          <p className="mt-4 text-[var(--color-muted-foreground)] font-sans text-lg">
            From high-growth startups to enterprise research labs, NeuralFlow is the chosen infrastructure.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {caseStudies.map((study, idx) => (
            <div key={idx} className="glass-panel border border-[var(--color-border)] p-8 rounded-xl hover:border-primary transition-micro flex flex-col justify-between group">
              <div>
                <div className="flex gap-1 mb-6">
                  {[...Array(study.rating)].map((_, i) => (
                    <span key={i} className="text-primary text-lg">★</span>
                  ))}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{study.company}</h3>
                <p className="text-[var(--color-muted-foreground)] text-sm leading-relaxed mb-8">
                  &quot;{study.quote}&quot;
                </p>
              </div>
              <div className="pt-6 border-t border-[var(--color-border)] group-hover:border-[var(--color-border)]/50 transition-micro">
                <div className="text-3xl font-mono font-bold text-white mb-1 group-hover:text-primary transition-micro">{study.metric}</div>
                <div className="text-xs font-mono text-[var(--color-muted-foreground)] uppercase tracking-wider">{study.metricLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
Testimonials.displayName = 'Testimonials';
