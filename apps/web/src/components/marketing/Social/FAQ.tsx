"use client";

import React, { useState, useEffect } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

const faqs = [
  {
    question: "What is the NeuralFlow platform?",
    answer: "NeuralFlow is a specialized infrastructure for building and deploying custom AI agents. We provide the neural logic and edge nodes required to run autonomous workflows at enterprise scale."
  },
  {
    question: "Does NeuralFlow provide pre-built agents?",
    answer: "Yes. While you can build complex agents from scratch using our node editor or API, we provide dozens of pre-trained agent templates for customer support, data extraction, and routing out of the box."
  },
  {
    question: "How does the multi-region routing actually work?",
    answer: "Our engine automatically evaluates latency, token cost, and geographic compliance (like GDPR in Frankfurt) before routing an inference request to the optimal model and data center in real-time."
  },
  {
    question: "Can I use my own custom domain and custom LLM?",
    answer: "Absolutely. Enterprise tiers support full white-labeling and the ability to securely mount your fine-tuned models hosted on AWS, Azure, or GCP into our orchestration engine."
  }
];

export const FAQ = React.memo(() => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    pricingStore.trackRender('faq');
  });

  return (
    <section className="py-24 relative z-10 bg-[var(--color-card)] border-y border-[var(--color-border)]" aria-labelledby="faq-title">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-[1fr_2fr] gap-12">
          
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[var(--color-muted-foreground)] mb-4 flex items-center gap-2 uppercase">
              <img src="/svgs/search.svg" className="w-4 h-4 invert opacity-50" /> FAQ
            </div>
            <h2 id="faq-title" className="text-4xl font-bold text-white mb-4 tracking-tighter">
              Common Inquiries
            </h2>
            <p className="text-[var(--color-muted-foreground)] font-sans text-sm mb-8">
              Everything you need to know about deploying, scaling, and securing your neural agents. Can&apos;t find an answer?
            </p>
            <button className="px-6 py-3 border border-[var(--color-border)] text-white hover:bg-[var(--color-background)] rounded transition-micro font-mono text-xs flex items-center gap-3 w-fit glass-panel">
              <span className="text-primary">&gt;</span> Contact Us
            </button>
          </div>

          <div className="flex flex-col border-t border-[var(--color-border)]">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={idx} className="border-b border-[var(--color-border)]">
                  <button 
                    className="w-full text-left py-6 flex items-center justify-between group hover:text-white transition-micro"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span className={`font-bold font-sans text-lg transition-micro ${isOpen ? 'text-primary' : 'text-white group-hover:text-primary'}`}>
                      {faq.question}
                    </span>
                    <span className={`text-2xl font-light font-mono transition-transform duration-400 ${isOpen ? 'rotate-45 text-primary' : 'text-[var(--color-muted-foreground)]'}`}>
                      +
                    </span>
                  </button>
                  <div 
                    className={`accordion-content ${isOpen ? 'max-h-40 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
                  >
                    <p className="text-[var(--color-muted-foreground)] text-sm leading-relaxed pr-8 font-sans">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>
      </div>
    </section>
  );
});
FAQ.displayName = 'FAQ';
