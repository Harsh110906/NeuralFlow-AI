"use client";

import React, { useState, useEffect } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

export const Newsletter = React.memo(() => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    pricingStore.trackRender('newsletter');
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section className="py-24 relative z-10 bg-[var(--color-background)]" aria-labelledby="newsletter-title">
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none overflow-hidden">
        <div className="w-[800px] h-[300px] bg-secondary/10 blur-[100px] mix-blend-screen rounded-[100%]"></div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
        <div className="text-[10px] font-mono tracking-widest text-[var(--color-muted-foreground)] mb-6 flex items-center justify-center gap-2 uppercase">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> GET STARTED
        </div>
        
        <h2 id="newsletter-title" className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">
          Get smarter about <br className="hidden md:block"/>AI systems
        </h2>
        
        <p className="text-[var(--color-muted-foreground)] font-sans text-lg mb-10 max-w-xl mx-auto font-light">
          Weekly insights on automation, AI workflows, and real builds. No fluff, just what works.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder="jane@enterprise.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-grow px-6 py-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-primary transition-micro shadow-inner"
            required
          />
          <button 
            type="submit" 
            className="px-8 py-4 bg-white text-black font-bold font-mono text-sm rounded-lg hover:bg-primary hover:text-[var(--color-primary-foreground)] transition-micro whitespace-nowrap flex items-center justify-center gap-2"
          >
            {subscribed ? 'Subscribed!' : (
              <><span className="text-black bg-black/10 px-2 py-0.5 rounded text-[10px]">&gt;&gt;</span> Subscribe</>
            )}
          </button>
        </form>
      </div>
    </section>
  );
});
Newsletter.displayName = 'Newsletter';
