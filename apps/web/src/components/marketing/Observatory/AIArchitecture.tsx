"use client";

import React, { useEffect, useRef, useState } from 'react';
import { pricingStore } from '@/lib/store/pricingStore';

export const AIArchitecture = React.memo(() => {
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'INR'>('USD');
  const [isSimulating, setIsSimulating] = useState(false);
  const initialMetrics = { latency: 45, throughput: 1200, automated: 91.2 };
  const metricsRef = useRef<{ latency: number, throughput: number, automated: number }>(initialMetrics);
  const [displayMetrics, setDisplayMetrics] = useState(initialMetrics);

  useEffect(() => {
    return pricingStore.subscribe(() => {
      setCurrency(pricingStore.getState().currency);
    });
  }, []);

  useEffect(() => {
    let frame: number;
    let lastTime = performance.now();
    const loop = (time: number) => {
      if (time - lastTime > 100) {
        metricsRef.current = {
          latency: isSimulating ? 11 : Math.max(20, metricsRef.current.latency + (Math.random() * 4 - 2)),
          throughput: isSimulating ? 10000 : Math.max(500, metricsRef.current.throughput + (Math.random() * 50 - 25)),
          automated: isSimulating ? 98.9 : Math.min(99, Math.max(85, metricsRef.current.automated + (Math.random() * 0.4 - 0.2)))
        };
        setDisplayMetrics({ ...metricsRef.current });
        lastTime = time;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [isSimulating]);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 3000);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto h-[600px] glass-panel border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center p-8">
      {/* Inner grid background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="absolute top-6 right-6 bg-[var(--color-background)]/80 backdrop-blur border border-[var(--color-border)] rounded-xl p-4 text-xs font-mono w-56 shadow-2xl z-20">
        <div className="flex justify-between mb-2">
          <span className="text-[var(--color-muted-foreground)]">System Latency:</span>
          <span className="text-secondary font-bold">{displayMetrics.latency.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-[var(--color-muted-foreground)]">Throughput:</span>
          <span className="text-primary font-bold">{displayMetrics.throughput.toFixed(0)} req/s</span>
        </div>
        <div className="flex justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
          <span className="text-[var(--color-muted-foreground)]">SLA Health:</span>
          <span className="text-white font-bold">{displayMetrics.automated.toFixed(2)}%</span>
        </div>
        <button 
          onClick={handleSimulate}
          disabled={isSimulating}
          className={`w-full py-2.5 rounded transition-micro font-bold tracking-widest ${isSimulating ? 'bg-secondary/20 text-secondary border border-secondary/50' : 'bg-primary text-[var(--color-primary-foreground)] hover:bg-secondary'}`}
        >
          {isSimulating ? 'EXECUTING TEST...' : 'STRESS TEST'}
        </button>
      </div>

      <div className="relative flex-grow w-full mt-16 flex flex-col items-center justify-between pointer-events-none z-10">
        
        <Node label="User Event Trigger" glowing={isSimulating} delay={0} icon="/svgs/arrow-path.svg" />
        
        <svg className="absolute w-full h-full left-0 top-0 -z-10 overflow-visible" aria-hidden="true">
          {/* Main vertical path */}
          <path d="M 270 50 L 270 120" stroke="url(#gradient)" strokeWidth="1" fill="none" strokeDasharray="2 2" className={`transition-micro ${isSimulating ? 'animate-flow stroke-primary' : 'stroke-[var(--color-border)]'}`} />
          <path d="M 270 180 L 270 250" stroke="url(#gradient)" strokeWidth="1" fill="none" strokeDasharray="2 2" className={`transition-micro ${isSimulating ? 'animate-flow stroke-primary' : 'stroke-[var(--color-border)]'}`} />
          
          {/* Branching paths to Orchestrator and Reasoner */}
          <path d="M 270 310 C 270 340, 160 340, 160 380" stroke="url(#gradient)" strokeWidth="1" fill="none" strokeDasharray="2 2" className={`transition-micro ${isSimulating ? 'animate-flow stroke-primary' : 'stroke-[var(--color-border)]'}`} />
          <path d="M 270 310 C 270 340, 380 340, 380 380" stroke="url(#gradient)" strokeWidth="1" fill="none" strokeDasharray="2 2" className={`transition-micro ${isSimulating ? 'animate-flow stroke-primary' : 'stroke-[var(--color-border)]'}`} />
          
          {/* Merging paths to Output */}
          <path d="M 160 440 C 160 480, 270 480, 270 510" stroke="url(#gradient)" strokeWidth="1" fill="none" strokeDasharray="2 2" className={`transition-micro ${isSimulating ? 'animate-flow stroke-primary' : 'stroke-[var(--color-border)]'}`} />
          <path d="M 380 440 C 380 480, 270 480, 270 510" stroke="url(#gradient)" strokeWidth="1" fill="none" strokeDasharray="2 2" className={`transition-micro ${isSimulating ? 'animate-flow stroke-primary' : 'stroke-[var(--color-border)]'}`} />
          
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--color-primary)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <Node label="Data Ingestion [Kafka]" glowing={isSimulating} delay={100} icon="/svgs/search.svg" />
        
        <Node label="Neural Routing [Active]" glowing={isSimulating} delay={200} icon="/svgs/link.svg" />

        <div className="flex gap-16 relative w-full justify-center">
          <Node label="LLM Reasoning" glowing={isSimulating} delay={300} icon="/svgs/cog-8-tooth.svg" small />
          <Node label="Agent Swarm" glowing={isSimulating} delay={400} icon="/svgs/cube-16-solid.svg" small />
        </div>

        <Node label="Output Generation" glowing={isSimulating} delay={500} highlight />
      </div>

      <div className="absolute bottom-6 left-6 right-6 flex justify-between px-2 text-[10px] uppercase font-mono tracking-widest text-[var(--color-muted-foreground)]">
        <div className="flex flex-col items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${currency === 'INR' ? 'bg-primary animate-pulse' : 'bg-[var(--color-border)]'}`}></span>
          <span className={`transition-layout ${currency === 'INR' ? 'text-primary font-bold' : ''}`}>Mumbai</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${currency === 'USD' ? 'bg-primary animate-pulse' : 'bg-[var(--color-border)]'}`}></span>
          <span className={`transition-layout ${currency === 'USD' ? 'text-primary font-bold' : ''}`}>Virginia</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${currency === 'EUR' ? 'bg-primary animate-pulse' : 'bg-[var(--color-border)]'}`}></span>
          <span className={`transition-layout ${currency === 'EUR' ? 'text-primary font-bold' : ''}`}>Frankfurt</span>
        </div>
      </div>
    </div>
  );
});
AIArchitecture.displayName = 'AIArchitecture';

function Node({ label, glowing, delay, highlight, icon, small }: { label: string, glowing: boolean, delay: number, highlight?: boolean, icon?: string, small?: boolean }) {
  return (
    <div 
      className={`relative px-5 py-3 rounded border transition-layout font-mono text-xs flex items-center gap-3 backdrop-blur-md
        ${small ? 'w-36 text-center justify-center flex-col py-4' : ''}
        ${highlight ? 'bg-white text-black border-white' : 'bg-[var(--color-background)]/90 border-[var(--color-border)] text-white'}
        ${glowing ? '!border-primary !bg-primary/10 !text-primary shadow-[0_0_20px_rgba(255,200,1,0.4)]' : ''}
      `}
      style={{ transitionDelay: `${glowing ? delay : 0}ms` }}
    >
      {icon && <img src={icon} className={`w-4 h-4 invert ${glowing ? 'invert-0' : 'opacity-60'} ${small ? 'mb-1' : ''}`} alt="" />}
      {label}
      
      {glowing && (
        <div className="absolute inset-0 rounded border border-primary animate-pulse-ring pointer-events-none"></div>
      )}
    </div>
  );
}
