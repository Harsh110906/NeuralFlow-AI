"use client";

import React, { useEffect } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';
import { NeuralBackground } from './NeuralBackground';
import { AIArchitecture } from '../Observatory/AIArchitecture';

export const Hero = React.memo(() => {
  useEffect(() => {
    pricingStore.trackRender('hero');
  });

  return (
    <section id="observatory" className="relative min-h-screen flex flex-col justify-center pt-24 pb-12 overflow-hidden text-[var(--color-foreground)]" aria-label="Hero">
      <NeuralBackground />
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-primary text-xs font-mono font-bold border border-[var(--color-border)] w-fit shadow-xl">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              NeuralFlow OS 2.0 Live
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[6.5rem] font-bold tracking-tighter text-white leading-[0.95] drop-shadow-2xl">
              Power your<br />future with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-[var(--color-muted-foreground)] max-w-xl leading-relaxed font-sans font-light">
              Deploy custom enterprise agents and automate complex workflows. Scale your intelligence with NeuralFlow today.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <a href="#pricing" className="group px-8 py-4 bg-white text-black rounded-lg font-bold font-mono hover:bg-gray-200 transition-micro flex items-center gap-3">
                <span className="bg-black text-white text-[10px] py-1 px-2 rounded group-hover:bg-primary transition-micro">&gt;</span> Build A Workflow
              </a>
            </div>
          </div>

          <div className="w-full flex justify-center lg:justify-end animate-fade-in" style={{animationDelay: '150ms', animationFillMode: 'both'}}>
            <AIArchitecture />
          </div>

        </div>
      </div>
    </section>
  );
});
Hero.displayName = 'Hero';
